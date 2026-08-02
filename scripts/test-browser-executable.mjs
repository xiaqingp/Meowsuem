import assert from "node:assert/strict";
import {resolveBrowserExecutable} from "./lib/browser-executable.mjs";

const accessFor = files => async file => {
  if (!files.has(file)) throw Object.assign(new Error("missing"), {code: "ENOENT"});
};
const chromium = executable => ({executablePath: () => executable});

assert.equal(await resolveBrowserExecutable(chromium("bundled"), {
  env: {MEOWSEUM_CHROME: "explicit"}, platform: "win32", access: accessFor(new Set(["explicit"])),
}), "explicit");
assert.equal(await resolveBrowserExecutable(chromium("bundled"), {
  env: {}, platform: "linux", access: accessFor(new Set(["bundled"])),
}), "bundled");
assert.equal(await resolveBrowserExecutable(chromium("missing"), {
  env: {ProgramFiles: "C:\\Program Files"}, platform: "win32",
  access: accessFor(new Set(["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"])),
}), "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
await assert.rejects(() => resolveBrowserExecutable(chromium("missing"), {
  env: {}, platform: "linux", access: accessFor(new Set()),
}), /No usable browser executable found/);
console.log("browser executable resolution tests passed");
