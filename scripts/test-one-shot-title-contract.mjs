import assert from "node:assert/strict";
import {articleTitleCandidates} from "./verify-one-shot-work.mjs";

assert.deepEqual(articleTitleCandidates({titleZh: "普通标题", titleEn: "Title"}), ["# 普通标题 / Title", "# 《普通标题》 / Title"]);
assert.deepEqual(articleTitleCandidates({titleZh: "《系列名》器物", titleEn: "Object"}), ["# 《系列名》器物 / Object"]);
assert(!articleTitleCandidates({titleZh: "《系列名》器物", titleEn: "Object"}).includes("# 《《系列名》器物》 / Object"));
console.log("one-shot title contract test passed");
