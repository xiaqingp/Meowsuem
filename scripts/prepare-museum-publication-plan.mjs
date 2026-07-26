import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";
import {atomicJson} from "./lib/work-status.mjs";

const parseArgs = argv => Object.fromEntries(argv.map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const readJson = file => fs.readFile(file, "utf8").then(JSON.parse);
const byId = (document, field) => new Map((document[field] ?? []).map(item => [item.workId ?? item.id,item]));
const extension = type => ({
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/tiff": "tif",
}[type] ?? "img");
const title = identity => ({
  zh: identity.titleZh ?? identity.title?.zh,
  en: identity.titleEn ?? identity.title?.en,
});
const bilingualName = value => {
  const parts = String(value || "").split(/\s+\/\s+/);
  return {zh: parts[0] || value, en: parts[1] || parts[0] || value};
};

export async function prepareMuseumPublicationPlan({projectRoot, kind, museum, caseId, runId}) {
  const manifest = await loadManifest(projectRoot);
  const {runRoot, descriptor} = await resolveCanonicalRun({
    projectRoot, manifest, runKind: kind, museumId: museum, caseId, runId, writable: true,
  });
  const museumId = descriptor.museumId ?? descriptor.targetMuseumId;
  const sourcePaths = [
    "scope/scope.json",
    "candidate-pool/candidate-pool.json",
    "selection/selection.json",
    "selection/rating-input.json",
    "rating/rating-result.json",
    "structure/structure.json",
    "image-evidence/verified-image-evidence.json",
    "reports/locked-metadata-report.json",
  ];
  const [scope, candidatesDoc, selectionDoc, ratingInput, ratingResult, structure, imagesDoc, lockedReport] =
    await Promise.all(sourcePaths.map(relative => readJson(path.join(runRoot,relative))));
  if ([scope.museumId,candidatesDoc.museumId,selectionDoc.museumId,ratingResult.museumId,structure.museumId,imagesDoc.museumId,lockedReport.museumId]
    .some(value => value !== museumId)) throw new Error("publication plan identity drift");

  const candidates = byId(candidatesDoc,"candidates");
  const selected = byId(selectionDoc,"selectedWorks");
  const placements = byId(structure,"works");
  const images = byId(imagesDoc,"works");
  const workIds = (structure.works ?? []).map(item => item.workId ?? item.id);
  if (workIds.length !== selected.size || workIds.some(id => !selected.has(id))) {
    throw new Error("publication plan structure IDs must exactly match selection");
  }
  if (JSON.stringify(workIds) !== JSON.stringify(lockedReport.works.map(work => work.workId))) {
    throw new Error("publication plan work order does not match locked metadata report");
  }
  if (!Array.isArray(scope.coordinates) || scope.coordinates.length !== 2 || scope.coordinates.some(value => typeof value !== "number")) {
    throw new Error("publication plan requires scope coordinates");
  }
  const chapters = (structure.chapters ?? []).map((chapter,index) => ({
    id: chapter.id ?? chapter.sectionId,
    number: chapter.number ?? String(index + 1).padStart(2,"0"),
    title: chapter.title,
    intro: chapter.intro ?? chapter.question ?? chapter.visitLogic ?? "",
  }));
  const chapterIds = new Set(chapters.map(chapter => chapter.id));
  const routeEntries = Array.isArray(structure.routes)
    ? structure.routes.map((route,index) => [["90","half","all"][index] ?? route.routeId,route])
    : Object.entries(structure.routes ?? {});
  const routes = Object.fromEntries(routeEntries.map(([id,route]) => [id,{
    title: route.title,
    note: route.note ?? route.purpose ?? "",
    workIds: route.workIds ?? [],
  }]));
  for (const required of ["90","half","all"]) if (!routes[required]) throw new Error(`publication plan missing route ${required}`);

  const works = workIds.map(workId => {
    const candidate = candidates.get(workId);
    const identity = candidate?.identity ? {...candidate,...candidate.identity} : candidate;
    const choice = selected.get(workId);
    const placement = placements.get(workId);
    const evidence = images.get(workId);
    if (!identity || !choice || !placement || evidence?.status !== "accepted" || !evidence.selected) {
      throw new Error(`${workId}: deterministic publication input is incomplete`);
    }
    const chapterId = placement.sectionId;
    if (!chapterIds.has(chapterId)) throw new Error(`${workId}: unknown chapter ${chapterId}`);
    const names = title(identity);
    const suffix = extension(evidence.selected.contentType);
    return {
      id: workId,
      ch: chapterId,
      significance: choice.significance,
      image: `./assets/${museumId}/${workId}.${suffix}`,
      imageSource: evidence.selected.url,
      imageCaption: [names.zh,names.en].filter(Boolean).join(" / "),
      source: identity.officialObjectUrl,
      localAssetSource: evidence.selected.localPath,
      imageKind: evidence.imagePolicy === "museum_hero_placeholder" ? "museum-placeholder" : "object",
      availabilityTag: choice.availability === "confirmed_on_view" ? "" : "不确定是否展出",
    };
  });
  const names = bilingualName(scope.museumName);
  const firstImage = works[0]?.image;
  const rating = ratingInput.rating;
  const museumRecord = {
    id: museumId,
    editorialCapacity: works.length,
    city: [scope.city,scope.country].filter(Boolean).join("，"),
    zh: names.zh,
    en: names.en,
    verdict: rating.scoreBand,
    hero: firstImage,
    contentFile: `research/content/${museumId}.md`,
    official: scope.officialCollectionUrl,
    visit: scope.officialCollectionUrl,
    contentUpdatedAt: new Date().toISOString().slice(0,10),
    intro: [
      structure.museum?.specialLine ?? structure.museum?.narrative ?? "",
      structure.museum?.travelConclusion ?? "",
    ].filter(Boolean),
    routes,
    rareAssets: rating.rareAssets ?? [],
  };
  const assemblyInput = {
    schemaVersion: 1,
    museum: museumRecord,
    chapters,
    routes,
    rating,
    works,
    integration: {coordinates: scope.coordinates},
    publication: {
      dataFile: `${museumId}.js`,
      cacheKey: `${museumId}-p${manifest.pipelineVersion.replaceAll(".","-")}`,
      cachePages: [],
    },
  };
  const assemblyRelative = "assembly/assembly-input.json";
  await atomicJson(path.join(runRoot,assemblyRelative),assemblyInput);
  const inputHashes = {};
  for (const relative of [...sourcePaths,assemblyRelative]) {
    inputHashes[relative] = sha256(await fs.readFile(path.join(runRoot,relative)));
  }
  const plan = {
    schemaVersion: 1, runId, museumId,
    contentContract: descriptor.contentContract,
    workIds, inputHashes,
    assemblyInput: assemblyRelative,
    candidateRoot: "candidate",
    proseInputsRead: false,
    networkCalls: 0,
  };
  await atomicJson(path.join(runRoot,"assembly","publication-plan.json"),plan);
  return plan;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await prepareMuseumPublicationPlan({
    projectRoot, kind: args.kind, museum: args.museum, caseId: args.case, runId: args["run-id"],
  });
  process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {process.stderr.write(`${error.message}\n`);process.exitCode=1;});
}
