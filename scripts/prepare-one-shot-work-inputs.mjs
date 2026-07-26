import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  assertPathInside,
  assertSafeIdentifier,
  loadManifest,
  resolveCanonicalRun,
} from "./lib/filesystem-contract.mjs";
import {atomicJson, writeWorkStatus} from "./lib/work-status.mjs";

const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const relative = (root, target) => path.relative(root, target).replaceAll("\\", "/");
const parseArgs = argv => Object.fromEntries(argv.map(arg => {
  if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
  const [key, ...rest] = arg.slice(2).split("=");
  return [key, rest.join("=")];
}));
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
const byId = value => new Map((value?.works ?? value?.candidates ?? value?.selectedWorks ?? []).map(item => [item.workId ?? item.id, item]));
const required = (value, label, owner) => {
  if (value === undefined || value === null || value === "") throw new Error(`${label} is missing; authoritative owner stage: ${owner}`);
  return value;
};

export async function prepareOneShotWorkInputs({projectRoot, kind, museum, caseId, runId, onlyWork}) {
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot, manifest, runKind: kind, museumId: museum, caseId, runId, writable: true,
  });
  const targetMuseumId = descriptor.museumId ?? descriptor.targetMuseumId;
  if (descriptor.contentContract !== "one_shot_v1" || descriptor.allowLegacyAuthorBundles) {
    throw new Error("locked metadata preparation requires a non-legacy one_shot_v1 run");
  }
  const files = {
    candidates: path.join(runRoot, "candidate-pool", "candidate-pool.json"),
    selection: path.join(runRoot, "selection", "selection.json"),
    structure: path.join(runRoot, "structure", "structure.json"),
    images: path.join(runRoot, "image-evidence", "verified-image-evidence.json"),
  };
  const [candidateDoc, selectionDoc, structureDoc, imageDoc] = await Promise.all(Object.values(files).map(readJson));
  const candidates = byId(candidateDoc);
  const selected = byId(selectionDoc);
  const structured = byId(structureDoc);
  const images = byId(imageDoc);
  const ids = [...selected.keys()].filter(id => !onlyWork || id === onlyWork);
  if (!ids.length) throw new Error(onlyWork ? `selected work not found: ${onlyWork}` : "selection contains no works");
  const outputs = [];
  for (const workId of ids) {
    assertSafeIdentifier(workId, "work id");
    const candidateRecord = candidates.get(workId);
    const identity = candidateRecord?.identity
      ? {...candidateRecord, ...candidateRecord.identity}
      : candidateRecord;
    const choice = selected.get(workId);
    const placement = structured.get(workId);
    const evidence = images.get(workId);
    if (!identity) throw new Error(`${workId}: identity missing; authoritative owner stage: museum_discovery`);
    if (!placement) throw new Error(`${workId}: section/stay/route role missing; authoritative owner stage: museum_structure`);
    if (!evidence || evidence.status !== "accepted") throw new Error(`${workId}: accepted image evidence missing; authoritative owner stage: image_evidence`);
    const picked = evidence.selected ?? evidence;
    const localPath = required(picked.localPath, `${workId}.verifiedImageLocalPath`, "image_evidence");
    const absoluteImage = path.resolve(projectRoot, localPath);
    await assertPathInside(runRoot, absoluteImage);
    const bytes = await fs.readFile(absoluteImage);
    const actualSha = sha256(bytes);
    if (actualSha !== required(picked.sha256, `${workId}.verifiedImageSha256`, "image_evidence")) {
      throw new Error(`${workId}: verified image SHA-256 mismatch`);
    }
    const imagePolicy = choice.imagePolicy ?? evidence.imagePolicy ?? "object_image";
    const locked = {
      schemaVersion: 2,
      museumId: targetMuseumId,
      workId,
      objectType: required(identity.objectType, `${workId}.objectType`, "museum_discovery"),
      titleZh: required(identity.titleZh, `${workId}.titleZh`, "museum_discovery"),
      titleEn: required(identity.titleEn, `${workId}.titleEn`, "museum_discovery"),
      artistZh: identity.artistZh ?? identity.cultureZh ?? "",
      artistEn: identity.artistEn ?? identity.cultureEn ?? "",
      displayDate: required(identity.displayDate, `${workId}.displayDate`, "museum_discovery"),
      medium: required(identity.medium, `${workId}.medium`, "museum_discovery"),
      accessionNumber: required(identity.accessionNumber, `${workId}.accessionNumber`, "museum_discovery"),
      museumName: required(candidateDoc.museumName ?? selectionDoc.museumName, "museumName", "museum_discovery"),
      officialObjectUrl: required(identity.officialObjectUrl, `${workId}.officialObjectUrl`, "museum_discovery"),
      significance: required(choice.significance, `${workId}.significance`, "museum_selection"),
      priority: required(choice.priority, `${workId}.priority`, "museum_selection"),
      availability: required(choice.availability, `${workId}.availability`, "museum_selection"),
      sectionId: required(placement.sectionId, `${workId}.sectionId`, "museum_structure"),
      stay: typeof required(placement.stay, `${workId}.stay`, "museum_structure") === "number"
        ? `${placement.stay}分钟`
        : placement.stay,
      routeRole: Array.isArray(placement.routeRole)
        ? placement.routeRole
        : placement.routeRole ? [placement.routeRole] : [],
      imagePolicy,
      verifiedImageUrl: required(picked.url, `${workId}.verifiedImageUrl`, "image_evidence"),
      verifiedImageLocalPath: localPath,
      verifiedImageSha256: actualSha,
      imageEvidencePath: relative(projectRoot, files.images),
    };
    const inputRoot = path.join(runRoot, "works", workId, "one-shot", "input");
    await fs.mkdir(inputRoot, {recursive: true});
    await atomicJson(path.join(inputRoot, "locked-metadata.json"), locked);
    await writeWorkStatus(runRoot, workId, {
      status: "locked_input_ready", lastStage: "locked_metadata", model: null, verification: null,
    });
    outputs.push({workId, path: relative(projectRoot, path.join(inputRoot, "locked-metadata.json")), sha256: sha256(Buffer.from(`${JSON.stringify(locked, null, 2)}\n`))});
  }
  const upstreamHashes = Object.fromEntries(await Promise.all(
    Object.entries(files).map(async ([name, file]) => [name, {
      path: relative(projectRoot, file),
      sha256: sha256(await fs.readFile(file)),
    }])
  ));
  const result = {
    schemaVersion: 1,
    runId,
    museumId: targetMuseumId,
    upstreamHashes,
    works: outputs,
  };
  await atomicJson(path.join(runRoot, "reports", "locked-metadata-report.json"), result);
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await prepareOneShotWorkInputs({
    projectRoot, kind: args.kind, museum: args.museum, caseId: args.case,
    runId: args["run-id"], onlyWork: args["only-work"],
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
