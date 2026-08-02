import fs from "node:fs/promises";
import {assertVerifiedImageEvidence} from "./lib/verified-image-evidence-contract.mjs";

const files = process.argv.slice(2);
if (!files.length) throw new Error("provide one or more verified-image-evidence JSON paths");
for (const file of files) {
  assertVerifiedImageEvidence(JSON.parse(await fs.readFile(file, "utf8")));
  process.stdout.write(`${file}: verified image evidence contract passed\n`);
}
