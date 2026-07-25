import fs from "node:fs/promises";
import "./verify-content-pipeline.mjs";

const sources = [
  ["louvre", new URL("../research/louvre-content-v4.md", import.meta.url)],
  ["met", new URL("../research/met-content-v2.md", import.meta.url)],
  ["seattle", new URL("../research/seattle-content-v2.md", import.meta.url)]
  ,["glyptotek", new URL("../research/glyptotek-content-v2.md", import.meta.url)]
  ,["muxin", new URL("../research/muxin-content-v1.md", import.meta.url)]
  ,["vienna", new URL("../research/vienna-content-v2.md", import.meta.url)]
  ,["enoura", new URL("../research/enoura-content-v1.md", import.meta.url)]
  ,["british", new URL("../research/british-content-v1.md", import.meta.url)]
  ,["anchorage", new URL("../research/anchorage-content-v1.md", import.meta.url)]
  ,["getty", new URL("../research/getty-content-v1.md", import.meta.url)]
  ,["chichu", new URL("../research/chichu-content-v1.md", import.meta.url)]
  ,["egyptian", new URL("../research/egyptian-content-v2.md", import.meta.url)]
  ,["alhambra", new URL("../research/alhambra-content-v1.md", import.meta.url)]
  ,["smk", new URL("../research/smk-content-v1.md", import.meta.url)]
  ,["frye", new URL("../research/frye-content-v1.md", import.meta.url)]
];
const strict = process.argv.includes("--strict");
const compact = process.argv.includes("--compact");
const museumArg = process.argv.find(argument => argument.startsWith("--museum="))?.slice("--museum=".length);
const activeSources = museumArg ? sources.filter(([museum]) => museum === museumArg) : sources;
if (museumArg && activeSources.length !== 1) throw new Error(`Unknown museum filter: ${museumArg}`);
const failures = [];
let checked = 0;
const instruction = await fs.readFile(new URL("../research/meowseum-content-instruction.md", import.meta.url), "utf8");
const manifest = JSON.parse(await fs.readFile(new URL("../research/content-standard-manifest.json", import.meta.url), "utf8"));
for (const phrase of ["唯一母指令", "Version: 1.6.8", "从已审阅顾爷样本中观察到的高层方法", "30 秒先懂", "人工声音评分", "12/14", "旅行评分：先定档，再定分", "证据类型检查", "继续看懂这家馆", "历史画或事件画不能只讲构图与风格", "结构统一，叙事入口不得统一", "卡片简介必须作为独立的价值判断写作", "稀世珍品硬门", "单一叙事主线与真实读者起点", "高风险断言表", "否定—转折骨架", "段落依赖审读", "断言闭环", "置信度与断言强度匹配", "中文母语审读", "核心历史背景", "访客可见正文只讲作品"]) {
  if (!instruction.includes(phrase)) failures.push(`canonical instruction: missing required contract “${phrase}”`);
}
if (manifest.canonicalInstruction !== "research/meowseum-content-instruction.md") failures.push("manifest: canonical instruction path mismatch");
if (manifest.currentVersion !== "1.6.8") failures.push("manifest: current instruction version mismatch");
for (const retired of ["meowseum-voice-guide.md", "work-content-template.md"]) {
  try {
    await fs.access(new URL(`../research/${retired}`, import.meta.url));
    failures.push(`canonical instruction: retired parallel standard still exists (${retired})`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
for (const [museum] of activeSources) {
  const audit = manifest.museums?.[museum];
  if (!audit) failures.push(`manifest: missing ${museum} audit record`);
  else if (!instruction.includes(`**${audit.targetVersion} —`)) failures.push(`manifest: ${museum} targets an unknown instruction version`);
  else if (!manifest.allowedStatuses.includes(audit.status)) failures.push(`manifest: ${museum} has invalid audit status`);
}
const styleRequired = {
  // Keep this editorial list explicit: famous authors/contributors need a work-specific style explanation.
  louvre: new Set([3, 4, 5, 6, 7, 8, 13, 14, 15, 25, 26, 27, 29, 30, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 57, 58, 60]),
  met: new Set([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]),
  seattle: new Set([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
  glyptotek: new Set([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
  muxin: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
  vienna: new Set(Array.from({length:40},(_,i)=>i+1)),
  enoura: new Set([1]),
  british: new Set([57, 58, 59, 60]),
  anchorage: new Set([1, 2, 3, 5, 6, 7, 8, 9, 10]),
  getty: new Set([4, 6, 9, 10, 11, 12, 15, 16, 20, 21, 22, 23, 24, 25, 28, 29]),
  chichu: new Set(Array.from({length:19},(_,i)=>i+1)),
  egyptian: new Set()
  ,alhambra: new Set()
  ,smk: new Set(Array.from({length:30},(_,i)=>i+1))
  ,frye: new Set(Array.from({length:20},(_,i)=>i+1))
};
const eventNarrativeRequired = {
  // Historical/event paintings must expose the event before formal analysis can carry the section.
  louvre: new Set([6, 7, 8, 13, 14, 15])
};

function visibleLength(text) {
  return [...text.replace(/https?:\/\/\S+/g, "").replace(/[#*_`>\[\]()｜—·\s]/g, "")].length;
}

function sections(markdown) {
  const matches = [...markdown.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
  return matches.map((match, index) => ({
    number: Number(match[1]),
    title: match[2],
    body: markdown.slice(match.index + match[0].length, matches[index + 1]?.index ?? markdown.length)
  }));
}

function repeatedProse(works) {
  const occurrences = new Map();
  const remember = (kind, text, workNumber) => {
    const normalized = text.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    if ([...normalized].length < (kind === "paragraph" ? 55 : 38)) return;
    const key = `${kind}:${normalized}`;
    if (!occurrences.has(key)) occurrences.set(key, new Set());
    occurrences.get(key).add(workNumber);
  };

  for (const work of works) {
    const prose = work.body
      .replace(/^\*\*(?:资料|图片)[^\n]*$/gm, "")
      .replace(/^\*\*(?:作者或文化|作者|年代|地点[^*]*|参观优先级|重要性)[^\n]*$/gm, "")
      .replace(/^###?\s+[^\n]+$/gm, "")
      .replace(/^\*\*[^*\n]+\*\*\s*[:：]?\s*$/gm, "");
    for (const paragraph of prose.split(/\n\s*\n/)) {
      const clean = paragraph.replace(/^[-*]\s+/gm, "").trim();
      if (!clean || /https?:\/\//.test(clean)) continue;
      remember("paragraph", clean, work.number);
      for (const sentence of clean.split(/(?<=[。！？])/)) remember("sentence", sentence, work.number);
    }
  }

  return [...occurrences.entries()]
    .filter(([, workNumbers]) => workNumbers.size > 1)
    .map(([key, workNumbers]) => ({kind:key.slice(0,key.indexOf(":")), text:key.slice(key.indexOf(":") + 1), works:[...workNumbers]}));
}

function unqualifiedSuperlatives(body) {
  const terms = ["极为罕见", "举世无双", "世界唯一", "全世界只有", "仅存"];
  const problems = [];
  for (const term of terms) {
    let from = 0;
    while ((from = body.indexOf(term, from)) >= 0) {
      const context = body.slice(Math.max(0, from - 18), from + term.length + 18);
      if (!/(不是|并非|不能|不可|不应|没有|不靠|排除|别把|不得|无法证明)/.test(context)) problems.push(term);
      from += term.length;
    }
  }
  return problems;
}

for (const [museum, file] of activeSources) {
  let markdown;
  try {
    markdown = await fs.readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`${museum}: content file pending`);
      if (strict) failures.push(`${museum}: missing content file`);
      continue;
    }
    throw error;
  }

  const works = sections(markdown);
  if (!compact) console.log(`${museum}: ${works.length} works found`);
  const declaredCapacity = manifest.museums?.[museum]?.declaredCapacity;
  if (![20, 30, 40, 60].includes(declaredCapacity)) failures.push(`${museum}: invalid or missing declared capacity`);
  if (works.length !== declaredCapacity) failures.push(`${museum}: expected ${declaredCapacity} works, found ${works.length}`);

  for (const duplicate of repeatedProse(works)) {
    failures.push(`${museum}: duplicate ${duplicate.kind} across works ${duplicate.works.join(", ")} — “${duplicate.text.slice(0,70)}${duplicate.text.length > 70 ? "…" : ""}”`);
  }

  if (manifest.museums?.[museum]?.targetVersion === manifest.currentVersion) {
    const quicks = works.map(work => work.body.match(/^###\s+30 秒先懂[^\n]*\n([\s\S]*?)(?=^###\s+)/m)?.[1]?.trim() || "");
    const firstSentences = quicks.map(text => (text.match(/^[^。！？]+[。！？]?/)?.[0] || text).replace(/[《》“”‘’\s]/g, ""));
    const seen = new Map();
    firstSentences.forEach((sentence,index) => {
      if (!sentence) return;
      if (seen.has(sentence)) failures.push(`${museum}/${index+1}: duplicates quick opening from work ${seen.get(sentence)+1}`);
      else seen.set(sentence,index);
    });
    for (let start=0; start<firstSentences.length-4; start+=1) {
      const prefixes = firstSentences.slice(start,start+5).map(sentence => sentence.replace(/[^\p{Script=Han}]/gu, "").slice(0,4));
      const counts = new Map(prefixes.map(prefix => [prefix,prefixes.filter(value => value === prefix).length]));
      const repeated = [...counts.entries()].find(([prefix,count]) => prefix && count >= 3);
      if (repeated) failures.push(`${museum}: works ${start+1}-${start+5} repeat opening skeleton “${repeated[0]}”`);
    }
    for (const banned of ["先用这两步抓住它，再决定是否继续读", "退后两步，把刚才看到的局部重新放回整体"]) {
      if (markdown.includes(banned)) failures.push(`${museum}: contains generated boilerplate “${banned}”`);
    }
  }

  for (const work of works) {
    checked += 1;
    const label = `${museum}/${work.number} ${work.title}`;
    const quick = work.body.match(/^###\s+30 秒先懂[^\n]*\n([\s\S]*?)(?=^###\s+)/m)?.[1]?.trim();
    const deepStart = work.body.match(/^###\s+(?!30 秒先懂|最后)[^\n]+\n/m);
    const deep = deepStart ? work.body.slice(deepStart.index + deepStart[0].length, work.body.search(/^###\s+最后[^\n]*$/m)).trim() : null;
    const finalHeading = work.body.match(/^###\s+最后[^\n]*$/m);
    const finalLook = finalHeading ? work.body.slice(finalHeading.index + finalHeading[0].length).trim() : null;
    const bullets = (deep?.match(/^[-*]\s+/gm) || []).length;
    const deepHeadings = [...(deep || "").matchAll(/^\*\*([^*\n]+)\*\*$/gm)].map(match => match[1]);
    const falsePremiseHeading = deepHeadings.find(heading => /纠正|先把.+(?:改|纠正)|别误会/.test(heading));
    const checklistHeadingCount = deepHeadings.filter(heading => /作者风格|艺术史价值|重要性结论|它究竟.{0,8}(?:重要|珍贵).{0,8}程度|珍贵在哪里/.test(heading)).length;
    const translationese = work.body.match(/两面石板怎样发明[^\n]{0,20}样子|视觉语法(?:正在|已经)?(?:成形|形成)|把[^。！？\n]{0,30}压成(?:政治|视觉)(?:程序|语言)/)?.[0];

    if (!quick) failures.push(`${label}: missing 30-second layer`);
    if (!deep) failures.push(`${label}: missing deep layer`);
    if (!finalLook) failures.push(`${label}: missing final look`);
    if (quick && (visibleLength(quick) < 70 || visibleLength(quick) > 240)) failures.push(`${label}: quick layer length ${visibleLength(quick)} outside anomaly bounds`);
    if (deep && visibleLength(deep) < 320) failures.push(`${label}: deep layer is too thin (${visibleLength(deep)})`);
    if (deep && bullets < 4) failures.push(`${label}: needs at least 4 observable details, found ${bullets}`);
    if (falsePremiseHeading) failures.push(`${label}: possible ungrounded correction heading “${falsePremiseHeading}”`);
    if (checklistHeadingCount >= 2) failures.push(`${label}: deep layer exposes ${checklistHeadingCount} editorial-checklist headings instead of one narrative spine`);
    if (translationese) failures.push(`${label}: possible translationese or abstract planning language “${translationese}”`);
    if (!/\*\*资料\*\*[^\n]*https?:\/\//.test(work.body)) failures.push(`${label}: missing linked sources`);
    const styleEvidence = /风格|笔触|构图|轮廓|线条|色彩|颜色|光线|表面|身体|衣褶|材料/.test(deep || "");
    if (styleRequired[museum].has(work.number) && !styleEvidence) {
      failures.push(`${label}: missing work-specific author style`);
    }
    if (eventNarrativeRequired[museum]?.has(work.number) && !/\*\*[^*\n]*(?:摄像机|不是神话|画的不是|战斗发生|后来|故事)[^*\n]*\*\*/.test(work.body)) {
      failures.push(`${label}: historical/event subject lacks an explicit narrative-context section`);
    }
    for (const term of unqualifiedSuperlatives(work.body)) failures.push(`${label}: unqualified claim “${term}”`);
  }
}

const expected = activeSources.reduce((sum, [museum]) => sum + (manifest.museums?.[museum]?.declaredCapacity || 0), 0);
console.log(`quality gate: ${checked}/${expected} works inspected, ${failures.length} failures`);
for (const failure of failures) console.error(`- ${failure}`);
if (strict && (checked !== expected || failures.length)) process.exitCode = 1;
