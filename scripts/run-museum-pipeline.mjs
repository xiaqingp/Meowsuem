import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun, transitionRunStatus} from "./lib/filesystem-contract.mjs";
import {atomicJson, writeWorkStatus} from "./lib/work-status.mjs";
import {prepareOneShotWorkInputs} from "./prepare-one-shot-work-inputs.mjs";
import {prepareMuseumPublicationPlan} from "./prepare-museum-publication-plan.mjs";
import {verifyOneShotWork, snapshotProtectedPaths} from "./verify-one-shot-work.mjs";
import {adaptOneShotWork} from "./adapt-one-shot-work.mjs";

const stages = ["museum_scope","museum_discovery","planning_research","museum_selection","rating","museum_structure","image_evidence","locked_metadata","single_work","publication_plan","assembly_publish_dry_run","generation_report"];
const parseArgs = argv => {
  const values = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, ...rest] = arg.slice(2).split("=");
    values[key] = rest.length ? rest.join("=") : true;
  }
  return values;
};
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const exists = file => fs.access(file).then(() => true).catch(() => false);
const runCommand = (command, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {cwd, stdio: "inherit", shell: false});
  child.on("error", reject);
  child.on("exit", code => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited ${code}`)));
});
const rel = (root, file) => path.relative(root, file).replaceAll("\\", "/");
export const shouldReuseCompletedStage = ({stage, doneExists, mock, retryFailed}) =>
  doneExists && !mock && !(stage === "single_work" && retryFailed);

async function acceptMockSingleWork({projectRoot,runRoot,descriptor,manifest,workId}) {
  const museumId=descriptor.museumId??descriptor.targetMuseumId;
  const root=path.join(runRoot,"works",workId,"one-shot");
  const locked=JSON.parse(await fs.readFile(path.join(root,"input","locked-metadata.json"),"utf8"));
  const mockRoot=path.join(root,"mock-output");
  await fs.mkdir(path.join(root,"output"),{recursive:true});
  await Promise.all(["article.md","sources.json"].map(name=>fs.copyFile(path.join(mockRoot,name),path.join(root,"output",name))));
  const protectedPaths=[`research/content/${museumId}.md`,"index.html","museum.html","museum-app.js","museums.js","routes.js","ratings.js"];
  const existingProtected=[];
  for (const item of protectedPaths) if (await exists(path.join(projectRoot,item))) existingProtected.push(item);
  const protectedSnapshot=await snapshotProtectedPaths(projectRoot,existingProtected);
  const verification=await verifyOneShotWork({
    projectRoot,artifactRoot:root,expectedMetadata:locked,protectedPaths:existingProtected,protectedSnapshot,
    model:manifest.modelRouting.single_work.model,reasoningEffort:manifest.modelRouting.single_work.reasoningEffort,runKind:descriptor.runKind,
  });
  if (verification.status!=="passed") throw new Error(`${workId}: mock one-shot verification failed ${JSON.stringify(verification.errors)}`);
  await atomicJson(path.join(root,"verification.json"),verification);
  await adaptOneShotWork({artifactRoot:root,verification});
  await atomicJson(path.join(root,"result.json"),{
    schemaVersion:2,status:"accepted",runId:descriptor.runId,museumId,caseId:descriptor.caseId??null,workId,stage:"single_work",
    model:manifest.modelRouting.single_work.model,reasoningEffort:manifest.modelRouting.single_work.reasoningEffort,
    agentRunCount:0,modelRoundCount:0,webSearchCount:0,webOpenCount:0,inputTokens:0,cachedInputTokens:0,
    reasoningTokens:0,outputTokens:0,totalTokens:0,attempt:1,mock:true,
  });
  await writeWorkStatus(runRoot,workId,{status:"accepted",attempt:1,lastStage:"integration",model:manifest.modelRouting.single_work.model,verification:"passed"});
}

async function writeHeader({projectRoot, runRoot, descriptor, manifest, directory, stage, model, effort, inputs, outputs, mock}) {
  const allowedInputs = [];
  for (const input of inputs) {
    const bytes = await fs.readFile(input.path);
    allowedInputs.push({path: rel(projectRoot, input.path), role: input.role, sha256: sha256(bytes)});
  }
  const header = {
    runId: descriptor.runId, startedAt: new Date().toISOString(), stage,
    ...(descriptor.runKind==="production"?{museumId:descriptor.museumId}:{caseId:descriptor.caseId}),
    pipelineVersion: descriptor.pipelineVersion,
    instructionVersion: descriptor.instructionVersion,
    executionProfile: {model, reasoningEffort: effort, runner: "scripts/run-isolated-generation.ps1"},
    allowedInputs, outputs, reviewer: "disabled", retry: "explicit_only",
    publicationBoundary: "run_only",
  };
  await atomicJson(path.join(directory, "run-header.json"), header);
  await runCommand("powershell.exe", [
    "-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",
    path.join(projectRoot, manifest.canonicalRunner),"-ProjectRoot",projectRoot,"-RunDirectory",directory,
    ...(mock ? ["-RecordOutputsOnly"] : []),
  ], projectRoot);
}

export async function runMuseumPipeline(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const manifest = await loadManifest(projectRoot);
  const runKind=String(args.kind??"production");
  if(!["production","experiment","regression"].includes(runKind)) throw new Error(`unsupported --kind: ${runKind}`);
  if(runKind!=="production"&&!args.case) throw new Error(`--case is required for ${runKind} runs`);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot, manifest, runKind, museumId:args.museum,caseId:args.case,runId: args["run-id"], writable: true,
  });
  const museumId=descriptor.museumId??descriptor.targetMuseumId;
  if(!museumId) throw new Error("run descriptor is missing museumId/targetMuseumId");
  const identityArgs=[`--kind=${runKind}`,runKind==="production"?`--museum=${museumId}`:`--case=${descriptor.caseId}`,`--run-id=${descriptor.runId}`];
  if (descriptor.contentContract !== "one_shot_v1") throw new Error("orchestrator requires contentContract=one_shot_v1");
  if (descriptor.status === "created") await transitionRunStatus({projectRoot, runRoot, manifest, nextStatus: "running", timestamp: new Date()});
  const until = args.until ?? stages.at(-1);
  if (!stages.includes(until)) throw new Error(`unknown --until stage: ${until}`);
  const mock = Boolean(args.mock);
  const instruction = path.join(projectRoot, manifest.canonicalInstruction);
  const prompt = name => path.join(projectRoot, "research", "pipeline", "prompts", name);
  const executeStage = async (name, done, action) => {
    if (shouldReuseCompletedStage({
      stage: name,
      doneExists: await exists(done),
      mock,
      retryFailed: Boolean(args["retry-failed"]),
    })) return {stage: name, status: "already_complete"};
    if (args["dry-run"]) return {stage: name, status: "would_run"};
    await action();
    if (!(await exists(done))) throw new Error(`${name} did not create ${rel(runRoot, done)}`);
    return {stage: name, status: "completed"};
  };
  const results = [];
  for (const stage of stages) {
    if (stage === "museum_scope") {
      results.push(await executeStage(stage, path.join(runRoot,"scope","scope.json"), async () => {
        const requestPath = path.join(runRoot,"scope","request.json");
        if (!(await exists(requestPath))) {
          for (const required of ["museum-name","city","country"]) {
            if (!args[required]) throw new Error(`museum_scope requires --${required}=... when scope/request.json does not exist`);
          }
          await atomicJson(requestPath,{
            schemaVersion:1,museumId,museumName:args["museum-name"],
            city:args.city,country:args.country,
            ...(args["official-collection-url"]?{officialCollectionUrl:args["official-collection-url"]}:{}),
          });
        }
        await writeHeader({projectRoot,runRoot,descriptor,manifest,directory:path.join(runRoot,"scope"),stage:"museum_scope",
          model:manifest.modelRouting.museum_scope.model,effort:manifest.modelRouting.museum_scope.reasoningEffort,
          inputs:[{path:instruction,role:"content_instruction"},{path:requestPath,role:"museum_request"},{path:prompt("museum-scope.md"),role:"stage_prompt"}],
          outputs:["scope.json"],mock});
      }));
    } else if (stage === "museum_discovery") {
      results.push(await executeStage(stage, path.join(runRoot,"candidate-pool","candidate-pool.json"), async () => {
        await writeHeader({projectRoot,runRoot,descriptor,manifest,directory:path.join(runRoot,"candidate-pool"),stage:"museum_candidate_pool",
          model:manifest.modelRouting.museum_candidate_pool.model,effort:manifest.modelRouting.museum_candidate_pool.reasoningEffort,
          inputs:[{path:instruction,role:"content_instruction"},{path:path.join(runRoot,"scope","scope.json"),role:"museum_scope"},{path:prompt("museum-discovery.md"),role:"stage_prompt"}],
          outputs:["candidate-pool.json"],mock});
        const discovered=JSON.parse(await fs.readFile(path.join(runRoot,"candidate-pool","candidate-pool.json"),"utf8"));
        for(const record of discovered.candidates??[]) await writeWorkStatus(runRoot,record.workId??record.id,{status:"identity_ready",lastStage:"museum_discovery"});
      }));
    } else if (stage === "planning_research") {
      const done = path.join(runRoot,"research","planning-index.json");
      results.push(await executeStage(stage, done, async () => {
        const pool = JSON.parse(await fs.readFile(path.join(runRoot,"candidate-pool","candidate-pool.json"),"utf8"));
        const entries = [];
        const runResearchBatches = async (kind, works) => {
          if (!works.length) return;
          for (let offset=0; offset<works.length; offset+=10) {
            const batchNumber=String(Math.floor(offset/10)+1).padStart(2,"0");
            const directory = path.join(runRoot,"research","batches",`${kind}-${batchNumber}`);
            await fs.mkdir(directory,{recursive:true});
            await atomicJson(path.join(directory,"candidate-packet.json"),{museumId,works:works.slice(offset,offset+10)});
            const output = kind === "compact" ? "compact-planning-evidence.json" : "deep-research-dossier.json";
            const route = kind === "compact" ? manifest.modelRouting.planning_research.standard : manifest.modelRouting.planning_research.deep;
            const stageResult = path.join(directory,`${kind}_planning_research-result.json`);
            const batchComplete = await exists(path.join(directory,output))
              && await exists(path.join(directory,"run-header.json"))
              && await exists(stageResult);
            if (!batchComplete) {
              await writeHeader({projectRoot,runRoot,descriptor,manifest,directory,stage:`${kind}_planning_research`,model:route.model,effort:route.reasoningEffort,
                inputs:[{path:instruction,role:"content_instruction"},{path:prompt("planning-research.md"),role:"stage_prompt"},{path:path.join(directory,"candidate-packet.json"),role:"candidate_packet"}],
                outputs:[output],mock});
            }
            entries.push({kind,path:rel(projectRoot,path.join(directory,output)),sha256:sha256(await fs.readFile(path.join(directory,output)))});
          }
        };
        const allCandidates = pool.candidates ?? [];
        await runResearchBatches("compact", allCandidates);
        const compactEvidence = [];
        for (const entry of entries.filter(item => item.kind === "compact")) {
          const document = JSON.parse(await fs.readFile(path.resolve(projectRoot,entry.path),"utf8"));
          compactEvidence.push(...(document.works ?? []));
        }
        const compactById = new Map(compactEvidence.map(work => [work.workId ?? work.id,work]));
        const deep = allCandidates.filter(candidate => {
          const evidence = compactById.get(candidate.workId ?? candidate.id);
          return (candidate.riskFlags ?? []).length > 0
            || (evidence?.riskFlags ?? []).length > 0
            || evidence?.rareCandidate === true
            || evidence?.identityStatus !== "stable";
        });
        await runResearchBatches("deep", deep);
        await atomicJson(done,{schemaVersion:1,museumId,batches:entries});
        for(const record of pool.candidates??[]) await writeWorkStatus(runRoot,record.workId??record.id,{status:"planning_evidence_ready",lastStage:"planning_research"});
      }));
    } else if (stage === "museum_selection") {
      results.push(await executeStage(stage,path.join(runRoot,"selection","selection.json"),async()=>{
        const planningIndexPath=path.join(runRoot,"research","planning-index.json");
        const planningIndex=JSON.parse(await fs.readFile(planningIndexPath,"utf8"));
        const evidenceInputs=planningIndex.batches.map(item=>({path:path.resolve(projectRoot,item.path),role:item.kind==="deep"?"deep_research_dossier":"compact_planning_evidence"}));
        await writeHeader({projectRoot,runRoot,descriptor,manifest,directory:path.join(runRoot,"selection"),stage:"museum_selection",
          model:manifest.modelRouting.museum_selection.model,effort:manifest.modelRouting.museum_selection.reasoningEffort,
          inputs:[{path:instruction,role:"content_instruction"},{path:prompt("museum-selection.md"),role:"stage_prompt"},{path:path.join(runRoot,"candidate-pool","candidate-pool.json"),role:"candidate_pool"},{path:planningIndexPath,role:"planning_index"},...evidenceInputs],
          outputs:["selection.json","rating-input.json"],mock});
        const selected=JSON.parse(await fs.readFile(path.join(runRoot,"selection","selection.json"),"utf8"));
        for(const record of selected.selectedWorks??selected.works??[]) await writeWorkStatus(runRoot,record.workId??record.id,{status:"selected",lastStage:"museum_selection"});
      }));
    } else if (stage === "rating") {
      results.push(await executeStage(stage,path.join(runRoot,"rating","rating-result.json"),async()=>{
        await runCommand(process.execPath,["scripts/process-museum-rating.mjs",...identityArgs],projectRoot);
      }));
    } else if (stage === "museum_structure") {
      results.push(await executeStage(stage,path.join(runRoot,"structure","structure.json"),async()=>{
        const planningIndexPath=path.join(runRoot,"research","planning-index.json");
        const planningIndex=JSON.parse(await fs.readFile(planningIndexPath,"utf8"));
        const evidenceInputs=planningIndex.batches.map(item=>({path:path.resolve(projectRoot,item.path),role:item.kind==="deep"?"deep_research_dossier":"compact_planning_evidence"}));
        await writeHeader({projectRoot,runRoot,descriptor,manifest,directory:path.join(runRoot,"structure"),stage:"museum_structure",
          model:manifest.modelRouting.museum_structure.model,effort:manifest.modelRouting.museum_structure.reasoningEffort,
          inputs:[{path:instruction,role:"content_instruction"},{path:prompt("museum-structure.md"),role:"stage_prompt"},
            {path:path.join(runRoot,"scope","scope.json"),role:"museum_scope"},
            {path:path.join(runRoot,"candidate-pool","candidate-pool.json"),role:"candidate_pool"},
            {path:path.join(runRoot,"selection","selection.json"),role:"museum_selection"},
            {path:path.join(runRoot,"rating","rating-result.json"),role:"museum_rating"},...evidenceInputs],
          outputs:["structure.json"],mock});
      }));
    } else if (stage === "image_evidence") {
      results.push(await executeStage(stage,path.join(runRoot,"image-evidence","verified-image-evidence.json"),async()=>{
        if (!mock) {
          await runCommand(process.execPath,["scripts/resolve-museum-image-evidence.mjs",...identityArgs,"--allow-model"],projectRoot);
        }
      }));
    } else if (stage === "locked_metadata") {
      results.push(await executeStage(stage,path.join(runRoot,"reports","locked-metadata-report.json"),async()=>{
        await prepareOneShotWorkInputs({projectRoot,kind:runKind,museum:runKind==="production"?museumId:undefined,caseId:descriptor.caseId,runId:descriptor.runId,onlyWork:args["only-work"]});
      }));
    } else if (stage === "single_work") {
      results.push(await executeStage(stage,path.join(runRoot,"reports","single-work-batch.json"),async()=>{
        const workIds=JSON.parse(await fs.readFile(path.join(runRoot,"reports","locked-metadata-report.json"),"utf8")).works.map(x=>x.workId);
        if (mock) {
          for (const workId of workIds) await acceptMockSingleWork({projectRoot,runRoot,descriptor,manifest,workId});
        } else {
          const batchArgs=["scripts/run-generation-batch.mjs",...identityArgs,"--stage=single_work",
            ...(args["only-work"]?[`--only-work=${args["only-work"]}`]:[]),...(args["retry-failed"]?["--retry-failed"]:[])];
          await runCommand(process.execPath,batchArgs,projectRoot);
        }
        if (mock) {
          await atomicJson(path.join(runRoot,"reports","single-work-batch.json"),{
            schemaVersion:1,runId:descriptor.runId,museumId,caseId:descriptor.caseId??null,stage:"single_work",
            runs:workIds.length,accepted:workIds,failed:[],blocked:[],mock:true,
          });
        }
      }));
    } else if (stage === "publication_plan") {
      results.push(await executeStage(stage,path.join(runRoot,"assembly","publication-plan.json"),async()=>{
        await prepareMuseumPublicationPlan({projectRoot,kind:runKind,museum:runKind==="production"?museumId:undefined,caseId:descriptor.caseId,runId:descriptor.runId});
      }));
    } else if (stage === "assembly_publish_dry_run") {
      results.push(await executeStage(stage,path.join(runRoot,"reports","finalization-report.json"),async()=>{
        await runCommand(process.execPath,["scripts/finalize-museum.mjs",...identityArgs],projectRoot);
      }));
    } else {
      results.push(await executeStage(stage,path.join(runRoot,"reports","generation-report.json"),async()=>{
        if (mock) {
          await atomicJson(path.join(runRoot,"reports","generation-report.json"),{
            schemaVersion:1,runId:descriptor.runId,museumId,caseId:descriptor.caseId??null,mock:true,
            tokenUsage:{input:0,cachedInput:0,reasoning:0,output:0,total:0},
            weightedCreditEstimate:"unavailable",
          });
        } else {
          await runCommand(process.execPath,["scripts/report-museum-generation.mjs",...identityArgs],projectRoot);
        }
      }));
    }
    if (stage === until) break;
  }
  const report={schemaVersion:1,runId:descriptor.runId,runKind,museumId,caseId:descriptor.caseId??null,until,results};
  await atomicJson(path.join(runRoot,"reports","orchestrator-result.json"),report);
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMuseumPipeline().then(result=>process.stdout.write(`${JSON.stringify(result,null,2)}\n`))
    .catch(error=>{process.stderr.write(`${error.message}\n`);process.exitCode=1;});
}
