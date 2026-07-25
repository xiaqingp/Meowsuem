import fs from "node:fs";

const markdown = fs.readFileSync(new URL("../research/louvre-content-v4.md", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../research/content-standard-manifest.json", import.meta.url), "utf8"));
const expected = manifest.museums.louvre.declaredCapacity;
const afterStart = markdown.indexOf("\n# 参观前的实时提醒");
const matches = [...markdown.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
if (matches.length !== expected) throw new Error(`应有 ${expected} 件作品，实际为 ${matches.length}`);

const sections = matches.map((match, index) => {
  const nextWork = index + 1 < matches.length ? matches[index + 1].index : afterStart;
  const nextChapter = markdown.indexOf("\n# ", match.index + match[0].length);
  const end = nextChapter >= 0 ? Math.min(nextWork, nextChapter) : nextWork;
  return markdown.slice(match.index + match[0].length, end).trim();
});

const leaks = sections.flatMap((body, index) => /^#\s+/m.test(body) ? [index + 1] : []);
if (leaks.length) throw new Error(`作品 ${leaks.join(", ")} 的正文仍包含章节标题`);
console.log(`OK: ${sections.length} / ${sections.length} 件作品正文均在下一件作品或下一章前结束`);
