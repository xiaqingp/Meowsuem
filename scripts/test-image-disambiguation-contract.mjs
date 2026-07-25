import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const manifest = JSON.parse(await fs.readFile(path.join(root, "research/content-standard-manifest.json"), "utf8"));
const runId = "20260725T151500Z-p2.9.0";
const runRoot = path.join(root, "research", "runs", "regression", "image-disambiguation-contract", runId);
const stageRoot = path.join(runRoot, "image-evidence", "contract-fixture");
const candidateRoot = path.join(stageRoot, "candidates");
await fs.rm(runRoot, {recursive: true, force: true});
await fs.mkdir(candidateRoot, {recursive: true});

const workImage = path.join(root, "research", "pipeline", "tests", "v2.8.0-image-browser", "image-evidence", "assets", "double-elvis-browser-fixture.jpg");
const wrongImage = path.join(root, "assets", "enoura", "winter-tunnel.jpg");
const copiedWork = path.join(candidateRoot, "candidate-work.jpg");
const copiedWrong = path.join(candidateRoot, "candidate-wrong.jpg");
await fs.copyFile(workImage, copiedWork);
await fs.copyFile(wrongImage, copiedWrong);
const hash = async file => crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
const rel = file => path.relative(root, file).replaceAll("\\", "/");
const packetPath = path.join(stageRoot, "image-candidate-packet.json");
const packet = {
  museumId: "seattle",
  works: [{
    workId: "double-elvis-model-fixture",
    identity: {
      title: "Double Elvis",
      artistOrCulture: "Andy Warhol",
      date: "1963/1976",
      identityAnchor: "76.9",
      identitySourceUrl: "https://art.seattleartmuseum.org/objects/3307/double-elvis"
    },
    officialPageTitle: "Double Elvis – Works – eMuseum",
    candidates: [
      {
        id: "candidate-work",
        localPath: rel(copiedWork),
        sha256: await hash(copiedWork),
        url: "https://art.seattleartmuseum.org/internal/media/dispatcher/29806/preview",
        method: "official_og_image",
        width: 500,
        height: 346
      },
      {
        id: "candidate-wrong",
        localPath: rel(copiedWrong),
        sha256: await hash(copiedWrong),
        url: "https://example.invalid/wrong-image.jpg",
        method: "unverified_candidate",
        width: 800,
        height: 533
      }
    ]
  }]
};
await fs.writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
const instructionPath = path.join(root, manifest.canonicalInstruction);
const header = {
  runId,
  startedAt: new Date().toISOString(),
  stage: "image_disambiguation",
  targetMuseumId: "seattle",
  works: [{museumId: "seattle", workId: "double-elvis-model-fixture", workIdentity: packet.works[0].identity}],
  pipelineVersion: manifest.pipelineVersion,
  instructionVersion: manifest.currentVersion,
  executionProfile: manifest.modelRouting.image_disambiguation,
  allowedInputs: [
    {path: rel(instructionPath), role: "content_instruction", sha256: await hash(instructionPath)},
    {path: rel(packetPath), role: "image_candidate_packet", sha256: await hash(packetPath)}
  ],
  outputs: ["image-decisions.json"],
  reviewer: "disabled",
  retry: "disabled",
  publicationBoundary: "evidence_only"
};
header.caseId = "image-disambiguation-contract";
await fs.writeFile(path.join(runRoot, "run.json"), `${JSON.stringify({
  schemaVersion: 1,
  filesystemContractVersion: 1,
  runKind: "regression",
  runId,
  caseId: "image-disambiguation-contract",
  milestone: "M29",
  pipelineVersion: manifest.pipelineVersion,
  instructionVersion: manifest.currentVersion,
  status: "running",
  createdAt: "2026-07-25T15:15:00.000Z",
  createdBy: "scripts/test-image-disambiguation-contract.mjs",
  layoutVersion: 1,
  immutable: false
}, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(stageRoot, "run-header.json"), `${JSON.stringify(header, null, 2)}\n`, "utf8");

const validate = spawnSync("powershell.exe", [
  "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
  "-File", path.join(root, "scripts", "run-isolated-generation.ps1"),
  "-RunDirectory", stageRoot,
  "-ValidateOnly"
], {cwd: root, encoding: "utf8"});
if (validate.status !== 0) throw new Error(validate.stderr || validate.stdout);
if (!process.argv.includes("--run-model")) {
  await fs.rm(runRoot, {recursive: true, force: true});
  console.log("image disambiguation contract fixture passed");
  process.exit(0);
}
const run = spawnSync("powershell.exe", [
  "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
  "-File", path.join(root, "scripts", "run-isolated-generation.ps1"),
  "-RunDirectory", stageRoot
], {cwd: root, encoding: "utf8", timeout: 10 * 60 * 1000});
if (run.status !== 0) throw new Error(run.stderr || run.stdout);
const output = JSON.parse(await fs.readFile(path.join(stageRoot, "image-decisions.json"), "utf8"));
const decision = output.decisions?.[0];
if (output.decisions?.length !== 1 || decision?.status !== "accepted" || decision.selectedCandidateId !== "candidate-work") {
  throw new Error(`Luna image decision failed: ${JSON.stringify(decision)}`);
}
await fs.rm(runRoot, {recursive: true, force: true});
console.log("Luna image disambiguation passed: correct official work image selected");
