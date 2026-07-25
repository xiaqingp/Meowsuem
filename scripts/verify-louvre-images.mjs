import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error("index.html 中没有找到 script");

new Function(script);

const files = [...script.matchAll(/file: "([^"]+)"/g)].map(match => match[1]);
if (files.length !== 20) throw new Error(`图片映射数量应为 20，实际为 ${files.length}`);
if (new Set(files).size !== 20) throw new Error("图片映射中存在重复文件");

const params = new URLSearchParams({
  action: "query",
  format: "json",
  prop: "imageinfo",
  iiprop: "url|mime",
  iiurlwidth: "640",
  titles: files.map(file => `File:${file}`).join("|")
});
const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
  headers: { "User-Agent": "MuseumPrototypeImageVerifier/1.0 (local development)" }
});
if (!response.ok) throw new Error(`Wikimedia Commons API 返回 ${response.status}`);

const payload = await response.json();
const pages = Object.values(payload.query?.pages || {});
const checks = pages.map(page => ({
  file: page.title?.replace(/^File:/, ""),
  missing: "missing" in page,
  mime: page.imageinfo?.[0]?.mime || "",
  thumbnail: page.imageinfo?.[0]?.thumburl || ""
}));
for (const check of checks) console.log(`${check.missing ? "MISSING" : "OK"}\t${check.mime}\t${check.file}\t${check.thumbnail}`);

const failed = checks.filter(check => check.missing || !check.mime.startsWith("image/") || !check.thumbnail);
if (checks.length !== 20 || failed.length) throw new Error(`API 核验失败：返回 ${checks.length} 项，异常 ${failed.length} 项`);
console.log(`OK: ${checks.length} / ${checks.length} 个文件均存在并提供缩略图`);
