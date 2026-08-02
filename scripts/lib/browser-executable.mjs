import fs from "node:fs/promises";
import path from "node:path";

const exists = async (file, access) => access(file).then(() => true).catch(() => false);

export async function resolveBrowserExecutable(chromium, {
  env = process.env,
  platform = process.platform,
  access = fs.access,
} = {}) {
  const explicit = env.MEOWSEUM_CHROME;
  if (explicit) {
    if (await exists(explicit, access)) return explicit;
    throw new Error(`MEOWSEUM_CHROME does not exist: ${explicit}`);
  }

  const candidates = [chromium.executablePath()];
  if (platform === "win32") {
    for (const root of [env.ProgramFiles, env["ProgramFiles(x86)"], env.LOCALAPPDATA].filter(Boolean)) {
      candidates.push(
        path.join(root, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
      );
    }
  } else if (platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    );
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge");
  }

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    if (await exists(candidate, access)) return candidate;
  }
  throw new Error(`No usable browser executable found; checked: ${candidates.filter(Boolean).join(", ")}`);
}
