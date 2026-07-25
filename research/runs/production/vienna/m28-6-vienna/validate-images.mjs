import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "research", "m28-6", "vienna", "candidate", "image-manifest.json"), "utf8"));
const entries = Object.entries(manifest);
const failures = [];
const blocked = [];
let cursor = 0;

const isImage = (type, bytes) => type.startsWith("image/")
  || (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
  || (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47);

async function check(id, url) {
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 MeowseumImageVerifier/1.0", range: "bytes=0-2047" },
        signal: AbortSignal.timeout(20000)
      });
      if (response.status === 403 || response.status === 429) {
        blocked.push(`${id}: ${response.status} ${url}`);
        return;
      }
      if (!response.ok) {
        lastError = `${response.status} ${response.statusText}`;
        continue;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!isImage(response.headers.get("content-type") || "", bytes)) {
        failures.push(`${id}: response is not an image (${response.headers.get("content-type") || "no content type"})`);
      }
      return;
    } catch (error) {
      lastError = error.message;
    }
  }
  failures.push(`${id}: ${lastError} ${url}`);
}

await Promise.all(Array.from({ length: 10 }, async () => {
  while (cursor < entries.length) {
    const [id, item] = entries[cursor++];
    await check(id, item.image);
  }
}));

for (const item of blocked) console.warn(`host-blocked: ${item}`);
for (const item of failures) console.error(`broken: ${item}`);
if (entries.length !== 40) failures.push(`expected 40 images, found ${entries.length}`);
if (failures.length) process.exitCode = 1;
else console.log(`Vienna image gate passed: ${entries.length - blocked.length}/40 reachable, ${blocked.length} host-blocked, 0 broken`);
