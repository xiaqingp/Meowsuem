import assert from "node:assert/strict";
import {buildMuseumIntro, buildMuseumNames} from "./prepare-museum-publication-plan.mjs";

assert.deepEqual(buildMuseumIntro({specialFocus: "特别", actionConclusion: "值得去"}), ["特别", "值得去"]);
assert.deepEqual(buildMuseumIntro({specialLine: "旧字段", travelConclusion: "旧结论"}), ["旧字段", "旧结论"]);
assert.throws(() => buildMuseumIntro({}), /missing publication intro/);
assert.deepEqual(buildMuseumNames({museumName: "Designmuseum Danmark"}, {museum: {name: {zh: "丹麦设计博物馆", en: "Designmuseum Danmark"}}}), {zh: "丹麦设计博物馆", en: "Designmuseum Danmark"});
assert.deepEqual(buildMuseumNames({museumName: "旧馆 / Legacy Museum"}, {}), {zh: "旧馆", en: "Legacy Museum"});
assert.throws(() => buildMuseumNames({museumName: "English only"}, {}), /missing bilingual name/);
console.log("museum publication fields test passed");
