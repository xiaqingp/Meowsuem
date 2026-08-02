import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {loadManifest} from "./lib/filesystem-contract.mjs";
import {resolveBrowserExecutable} from "./lib/browser-executable.mjs";

const parseArgs = argv => {
  const values = {};
  for (const arg of argv) {
    if (!arg.startsWith("--") || !arg.includes("=")) throw new Error(`Expected --key=value, received ${arg}`);
    const [key, ...rest] = arg.slice(2).split("=");
    if (!["project-root", "mode"].includes(key)) throw new Error(`unknown option: --${key}`);
    values[key] = rest.join("=");
  }
  return values;
};

const commandAvailable = (command, args) => {
  const result = spawnSync(command, args, {encoding: "utf8", windowsHide: true});
  return result.status === 0;
};

export async function checkPipelineReadiness({projectRoot, mode = "live"}) {
  if (!["live", "mock"].includes(mode)) throw new Error("--mode must be live or mock");
  const failures = [];
  const root = path.resolve(projectRoot);
  const manifest = await loadManifest(root);
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 20) failures.push(`Node.js 20+ is required; found ${process.versions.node}`);
  if (process.platform !== "win32") failures.push("canonical generation currently requires Windows PowerShell");
  if (!commandAvailable("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "exit 0"])) {
    failures.push("powershell.exe is unavailable");
  }
  const canonicalFiles = Object.entries(manifest)
    .filter(([key, value]) => key.startsWith("canonical") && typeof value === "string")
    .map(([, value]) => value)
    .concat(manifest.releaseAdditionalCanonicalFiles ?? []);
  for (const relative of new Set(canonicalFiles)) {
    if (!await fs.access(path.join(root, relative)).then(() => true).catch(() => false)) failures.push(`missing canonical file: ${relative}`);
  }
  const pipelineText = await fs.readFile(path.join(root, manifest.canonicalPipeline), "utf8");
  if (!pipelineText.includes(`Pipeline: ${manifest.pipelineVersion}`)) {
    failures.push(`canonical pipeline document is not labeled ${manifest.pipelineVersion}`);
  }
  const release = await fs.readFile(path.join(root, manifest.currentRelease), "utf8").then(JSON.parse).catch(() => null);
  if (release?.version !== manifest.pipelineVersion) failures.push(`current release is missing or not version ${manifest.pipelineVersion}`);
  if (mode === "live") {
    if (!commandAvailable("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Get-Command codex.cmd -ErrorAction Stop | Out-Null"])) {
      failures.push("codex.cmd is unavailable");
    }
    const moduleRoots = [
      process.env.MEOWSEUM_NODE_MODULES,
      ...(process.env.NODE_PATH || "").split(path.delimiter),
      path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules"),
    ].filter(Boolean);
    let chromium;
    for (const directory of moduleRoots) {
      try {
        ({chromium} = createRequire(import.meta.url)(path.join(directory, "playwright")));
        break;
      } catch {}
    }
    if (!chromium) failures.push("Playwright is unavailable; set MEOWSEUM_NODE_MODULES");
    else {
      await resolveBrowserExecutable(chromium).catch(error => failures.push(error.message));
    }
  }
  return {status: failures.length ? "failed" : "passed", mode, pipelineVersion: manifest.pipelineVersion, failures};
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(args["project-root"] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = await checkPipelineReadiness({projectRoot, mode: args.mode ?? "live"});
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status !== "passed") process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
