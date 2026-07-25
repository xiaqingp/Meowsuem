import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    source: { type: "string" },
    selection: { type: "string" },
    out: { type: "string" },
    record: { type: "string" }
  }
});
if (!values.source || !values.selection || !values.out || !values.record) {
  throw new Error("usage: node scripts/prepare-author-research-input.mjs --source <research.md> --selection <work-selection.json> --out <author-input.md> --record <record.json>");
}
const sourcePath = path.resolve(values.source);
const selectionPath = path.resolve(values.selection);
const outputPath = path.resolve(values.out);
const recordPath = path.resolve(values.record);
const source = await fs.readFile(sourcePath, "utf8");
const selection = JSON.parse(await fs.readFile(selectionPath, "utf8"));
if (selection.identityStable !== true) throw new Error("author input requires identityStable true");
if (!["object_image", "museum_hero_placeholder"].includes(selection.imagePolicy)) throw new Error("invalid imagePolicy");

let transformed = source;
let replacements = 0;
if (selection.imagePolicy === "museum_hero_placeholder") {
  const rules = [
    [
      /(?:未补足前|未补前|因此|；)?作者阶段(?:的图像门)?(?:仍|继续)?阻塞。?/g,
      "；不得据此生成视觉观察；按馆舍占位图与可见性标签继续。"
    ],
    [
      /作者阶段(?:的图像门)?(?:仍|继续)?阻塞。?/g,
      "；不得据此生成视觉观察；按馆舍占位图与可见性标签继续。"
    ],
    [
      /(图片\/许可：未取得[^。\n]*?)[；，]?阻塞。?/g,
      "$1；使用馆舍占位图，不把占位图作为作品证据。"
    ],
    [
      /(常设身份)[；，]?阻塞。?/g,
      "$1未确认；使用可见性标签继续。"
    ]
  ];
  for (const [pattern, replacement] of rules) {
    transformed = transformed.replace(pattern, match => {
      replacements += 1;
      return typeof replacement === "function" ? replacement(match) : match.replace(pattern, replacement);
    });
  }
  transformed = transformed.replace(/，；/g, "；").replace(/；；/g, "；");
}
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, transformed, "utf8");
const sha256 = text => crypto.createHash("sha256").update(text).digest("hex");
await fs.writeFile(recordPath, `${JSON.stringify({
  source: values.source,
  sourceSha256: sha256(source),
  selection: values.selection,
  selectionSha256: sha256(await fs.readFile(selectionPath)),
  output: values.out,
  outputSha256: sha256(transformed),
  replacements,
  policy: selection.imagePolicy
}, null, 2)}\n`, "utf8");
console.log(`prepared author research input: ${replacements} obsolete workflow statements replaced`);
