import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {atomicJson, readWorkStatus, writeWorkStatus} from "./lib/work-status.mjs";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";
import {
  articleTitleCandidates,
  canonicalOneShotEffort,
  canonicalOneShotModel,
  snapshotProtectedPaths,
  verifyOneShotWork,
} from "./verify-one-shot-work.mjs";
import {workIdentityMatches} from "./lib/prior-work-identity.mjs";

const exists = file => fs.access(file).then(() => true).catch(() => false);

export const lockedMetadataCompatible = (current, prior) =>
  workIdentityMatches(current, prior);

const protectedSnapshot = async (projectRoot, museumId) => {
  const candidates = [
    `research/content/${museumId}.md`,
    "index.html", "museum.html", "museum-app.js", "museums.js", "routes.js", "ratings.js",
  ];
  const present = [];
  for (const relative of candidates) if (await exists(path.join(projectRoot, relative))) present.push(relative);
  return {paths: present, hashes: await snapshotProtectedPaths(projectRoot, present)};
};

async function priorRunRoots(projectRoot, museumId, currentRunId) {
  const museumRoot = path.join(projectRoot, "research", "runs", "production", museumId);
  const entries = await fs.readdir(museumRoot, {withFileTypes: true});
  const eligible = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === currentRunId) continue;
    const root = path.join(museumRoot, entry.name);
    const descriptor = await fs.readFile(path.join(root, "run.json"), "utf8").then(JSON.parse).catch(() => null);
    if (descriptor && ["accepted", "published"].includes(descriptor.status)) eligible.push(root);
  }
  return eligible.sort((a, b) => path.basename(b).localeCompare(path.basename(a)));
}

async function tryReuse({projectRoot, runRoot, descriptor, workId, priorRoots}) {
  const artifactRoot = path.join(runRoot, "works", workId, "one-shot");
  const currentLocked = JSON.parse(await fs.readFile(path.join(artifactRoot, "input", "locked-metadata.json"), "utf8"));
  for (const priorRoot of priorRoots) {
    const priorWorksRoot=path.join(priorRoot,"works");
    const priorEntries=await fs.readdir(priorWorksRoot,{withFileTypes:true}).catch(()=>[]);
    const matches=[];
    for(const entry of priorEntries.filter(item=>item.isDirectory())){
      const priorArtifact=path.join(priorWorksRoot,entry.name,"one-shot");
      const [priorResult,priorLocked]=await Promise.all([
        fs.readFile(path.join(priorArtifact,"result.json"),"utf8").then(JSON.parse).catch(()=>null),
        fs.readFile(path.join(priorArtifact,"input","locked-metadata.json"),"utf8").then(JSON.parse).catch(()=>null),
      ]);
      if(priorResult&&priorLocked&&["accepted","warning"].includes(priorResult.status)
        &&priorResult.model===canonicalOneShotModel&&priorResult.reasoningEffort===canonicalOneShotEffort
        &&lockedMetadataCompatible(currentLocked,priorLocked)) matches.push({priorArtifact,priorResult,priorLocked});
    }
    if(matches.length!==1) continue;
    const {priorArtifact,priorResult}=matches[0];

    const attempt = 1;
    const attemptRoot = path.join(artifactRoot, "attempts", "01");
    await fs.mkdir(path.join(attemptRoot, "input"), {recursive: true});
    await fs.mkdir(path.join(attemptRoot, "output"), {recursive: true});
    await fs.copyFile(path.join(artifactRoot, "input", "locked-metadata.json"), path.join(attemptRoot, "input", "locked-metadata.json"));
    const article=await fs.readFile(path.join(priorArtifact,"output","article.md"),"utf8");
    const adaptedArticle=article.replace(/^# .*$/m,articleTitleCandidates(currentLocked)[1]??articleTitleCandidates(currentLocked)[0]);
    const sources=JSON.parse(await fs.readFile(path.join(priorArtifact,"output","sources.json"),"utf8"));
    sources.museumId=currentLocked.museumId;
    sources.workId=currentLocked.workId;
    await fs.writeFile(path.join(attemptRoot,"output","article.md"),adaptedArticle);
    await fs.writeFile(path.join(attemptRoot,"output","sources.json"),`${JSON.stringify(sources,null,2)}\n`);
    const snapshot = await protectedSnapshot(projectRoot, currentLocked.museumId);
    const verification = await verifyOneShotWork({
      projectRoot, artifactRoot: attemptRoot, expectedMetadata: currentLocked,
      protectedPaths: snapshot.paths, protectedSnapshot: snapshot.hashes,
      model: canonicalOneShotModel, reasoningEffort: canonicalOneShotEffort, runKind: descriptor.runKind,
    });
    await atomicJson(path.join(attemptRoot, "verification.json"), verification);
    const now = new Date().toISOString();
    if (verification.status !== "passed") {
      const failed = {
        schemaVersion: 2, status: "failed", runId: descriptor.runId, museumId: currentLocked.museumId,
        workId, stage: "single_work", attempt, model: canonicalOneShotModel,
        reasoningEffort: canonicalOneShotEffort, inputTokens: 0, cachedInputTokens: 0,
        reasoningTokens: 0, outputTokens: 0, totalTokens: 0, agentRunCount: 0,
        modelRoundCount: 0, webSearchCount: 0, webOpenCount: 0,
        failureStage: "reuse_verification", failureCode: "PRIOR_OUTPUT_INCOMPATIBLE",
        failureMessage: "prior output failed verification against current locked metadata",
        reusedFromRunId: path.basename(priorRoot), reusedFromWorkId:priorResult.workId, completedAt: now,
      };
      await atomicJson(path.join(attemptRoot, "result.json"), failed);
      await atomicJson(path.join(artifactRoot, "result.json"), failed);
      await writeWorkStatus(runRoot, workId, {status:"verification_failed",attempt,lastStage:"reuse_verification",verification:"failed"});
      return {workId, status:"rejected", priorRunId:path.basename(priorRoot)};
    }

    await adaptOneShotWork({artifactRoot: attemptRoot, verification});
    for (const directory of ["output", "integration"]) await fs.cp(path.join(attemptRoot, directory), path.join(artifactRoot, directory), {recursive:true});
    await fs.copyFile(path.join(attemptRoot, "verification.json"), path.join(artifactRoot, "verification.json"));
    const accepted = {
      schemaVersion: 2, status: "accepted", runId: descriptor.runId, museumId: currentLocked.museumId,
      workId, stage: "single_work", attempt, model: canonicalOneShotModel,
      reasoningEffort: canonicalOneShotEffort, inputTokens: 0, cachedInputTokens: 0,
      reasoningTokens: 0, outputTokens: 0, totalTokens: 0, agentRunCount: 0,
      modelRoundCount: 0, webSearchCount: 0, webOpenCount: 0,
      reused: true, reusedFromRunId: path.basename(priorRoot), reusedFromWorkId:priorResult.workId, reusedFromAttempt: priorResult.attempt,
      completedAt: now,
    };
    await atomicJson(path.join(attemptRoot, "result.json"), accepted);
    await atomicJson(path.join(artifactRoot, "result.json"), accepted);
    await writeWorkStatus(runRoot, workId, {status:"accepted",attempt,lastStage:"integration",model:canonicalOneShotModel,verification:"passed",reusedFromRunId:path.basename(priorRoot)});
    return {workId, status:"reused", priorRunId:path.basename(priorRoot)};
  }
  return {workId, status:"not_found"};
}

export async function reusePriorSingleWorks({projectRoot, museum, runId}) {
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({projectRoot,manifest,runKind:"production",museumId:museum,runId,writable:true});
  const priorRoots = await priorRunRoots(projectRoot, museum, runId);
  const lockedReport = JSON.parse(await fs.readFile(path.join(runRoot,"reports","locked-metadata-report.json"),"utf8"));
  const works = [];
  for (const {workId} of lockedReport.works) {
    const status = await readWorkStatus(runRoot, workId);
    works.push(status?.status === "accepted" ? {workId,status:"already_accepted"} : await tryReuse({projectRoot,runRoot,descriptor,workId,priorRoots}));
  }
  const report = {
    schemaVersion:1, runId, museumId:museum,
    reused:works.filter(work=>work.status==="reused").map(work=>work.workId),
    rejected:works.filter(work=>work.status==="rejected").map(work=>work.workId),
    notFound:works.filter(work=>work.status==="not_found").map(work=>work.workId), works,
  };
  await atomicJson(path.join(runRoot,"reports","single-work-reuse.json"),report);
  return report;
}

const parseArgs = argv => Object.fromEntries(argv.map(arg => {
  const [key,...rest]=arg.replace(/^--/,"").split("="); return [key,rest.join("=")];
}));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args=parseArgs(process.argv.slice(2));
  reusePriorSingleWorks({projectRoot:path.resolve(args["project-root"]??new URL("..",import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,"$1")),museum:args.museum,runId:args["run-id"]})
    .then(report=>process.stdout.write(`${JSON.stringify(report,null,2)}\n`))
    .catch(error=>{process.stderr.write(`${error.message}\n`);process.exitCode=1;});
}
