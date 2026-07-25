import fs from "node:fs/promises";

const file = process.argv[2];
const cardFile = process.argv[3];
if (!file || !cardFile) throw new Error("usage: node scripts/verify-generation-sample.mjs <markdown> <card-summary-text>");
const markdown = await fs.readFile(file, "utf8");
const cardSummary = (await fs.readFile(cardFile, "utf8"))
  .replace(/^(?:<!--[^>\r\n]*-->\r?\n){1,3}\r?\n?/, "")
  .replace(/^(?:直接)?上游(?:文件)?：[^\r\n]+\r?\n(?:(?:直接)?上游(?:文件)?\s*)?SHA-?256：[0-9a-f]{64}\r?\n\r?\n/i, "")
  .trim();
const failures = [];
const visibleLength = text => [...text.replace(/https?:\/\/\S+/g, "").replace(/[#*_`>\[\]()｜—·\s]/g, "")].length;
const quick = markdown.match(/^###\s+30 秒先懂[^\n]*\n([\s\S]*?)(?=^###\s+多停)/m)?.[1]?.trim();
const deep = markdown.match(/^###\s+多停[^\n]*\n([\s\S]*?)(?=^###\s+最后)/m)?.[1]?.trim();
const bullets = deep?.match(/^[-*]\s+/gm)?.length ?? 0;
const visitorProse = markdown.split(/^\*\*事实边界\*\*/m)[0];
const contrastSkeletons = [
  ...(visitorProse.match(/(?:不是|并非)[^。！？\n]{0,80}(?:而是|只是|却是)/g) ?? []),
  ...(visitorProse.match(/(?:不是|并非)[^。！？\n]{0,80}[。！？]\s*相反/g) ?? []),
  ...(visitorProse.match(/[，；](?:而非|而不是)[^。！？\n]{1,80}/g) ?? [])
];

if (!quick || visibleLength(quick) < 70 || visibleLength(quick) > 240) failures.push(`quick layer invalid (${quick ? visibleLength(quick) : "missing"})`);
if (visibleLength(cardSummary) < 24 || visibleLength(cardSummary) > 100) failures.push(`card summary length invalid (${visibleLength(cardSummary)})`);
if (/^(?:先看|再看|先找|先用|先确认|先别|首先)/.test(cardSummary)) failures.push("card summary starts with a detail-page command");
if (/\s·\s/.test(cardSummary)) failures.push("card summary contains a structured metadata delimiter");
if (cardSummary.replace(/\s/g, "") === quick?.replace(/\s/g, "")) failures.push("card summary reuses the quick layer");
if (!deep || visibleLength(deep) < 320) failures.push(`deep layer invalid (${deep ? visibleLength(deep) : "missing"})`);
if (!/^###\s+最后[^\n]*看一眼/m.test(markdown)) failures.push("final look missing");
if (!/^\*\*材质\*\*：\s*\S+/m.test(markdown)) failures.push("material metadata missing");
if (bullets < 4) failures.push(`observable details: ${bullets}`);
if (contrastSkeletons.length > 1) failures.push(`repeated contrast skeletons: ${contrastSkeletons.length}`);
if (!/\*\*资料\*\*[^\n]*https?:\/\//.test(markdown)) failures.push("linked sources missing");
for (const term of ["世界唯一", "仅存", "极为罕见", "举世无双"]) {
  let from = 0;
  while ((from = markdown.indexOf(term, from)) >= 0) {
    const context = markdown.slice(Math.max(0, from - 24), from + term.length + 12);
    if (!/(不是|并非|不能|不可|不应|不支持|不表示|没有|未|禁止|别把|不得|无法|不靠)/.test(context)) failures.push(`unbounded claim: ${term}`);
    from += term.length;
  }
}
for (const term of ["黑盒", "测试", "提示词", "生成器", "图片许可", "发布前", "待补核", "reviewer", "manifest", "版本迁移"]) {
  if (markdown.includes(term)) failures.push(`production language: ${term}`);
}

console.log(`card=${visibleLength(cardSummary)} quick=${quick ? visibleLength(quick) : 0} deep=${deep ? visibleLength(deep) : 0} details=${bullets} failures=${failures.length}`);
for (const failure of failures) console.error(`- ${failure}`);
if (failures.length) process.exitCode = 1;
