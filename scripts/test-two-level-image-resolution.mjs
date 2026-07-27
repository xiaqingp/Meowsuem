import assert from "node:assert/strict";
import {
  acceptFastCandidate,
  assertNoDuplicateObjectImages,
  imageDimensions,
  normalizeAiResult,
} from "./lib/two-level-image-resolution.mjs";

const identity = {titleEn: "Water Lilies", titleZh: "睡莲", creator: "Claude Monet", displayDate: "1914-17", objectType: "single_work"};
const page = {title: "Water Lilies – Claude Monet", body: "Claude Monet Water Lilies", jsonLdRecords: [{name: "Water Lilies", creator: "Claude Monet"}], explicitRecords: []};

assert.ok(acceptFastCandidate(identity, page, {url: "https://example.org/object.jpg", title: "Water Lilies", creator: "Claude Monet", jsonLdObjectRelation: true}));
assert.ok(acceptFastCandidate(identity, page, {url: "https://example.org/iiif.jpg", title: "Water Lilies", creator: "Claude Monet", iiifManifestRelation: true}));
assert.equal(acceptFastCandidate(identity, {...page, jsonLdRecords: [], title: "Chichu Art Museum"}, {url: "https://example.org/hero.jpg", alt: "Chichu Art Museum", jsonLdObjectRelation: true}), null);
assert.equal(acceptFastCandidate(identity, page, {url: "https://example.org/hero.jpg", title: "Water Lilies", creator: "Claude Monet", jsonLdObjectRelation: true, alt: "museum hero"}), null);
assert.equal(acceptFastCandidate(identity, page, {url: "https://example.org/object.jpg", title: "Water Lilies", creator: "Claude Monet", figureCaptionRelation: true})?.method, "official_object_image");

const png = Buffer.alloc(24);
png.write("\x89PNG\r\n\x1a\n", 0, "binary");
png.writeUInt32BE(1200, 16);
png.writeUInt32BE(800, 20);
assert.deepEqual(imageDimensions(png, "image/png"), {width: 1200, height: 800});

const ai = normalizeAiResult({schemaVersion: 1, works: [{workId: "one", status: "not_found", selectedCandidate: null, limitations: ["missing"]}]});
assert.equal(ai.works[0].status, "not_found");
const legacy = normalizeAiResult({decisions: [{workId: "one", status: "accepted", imageUrl: "https://example.org/a.jpg", confidence: 0.9}]});
assert.equal(legacy.works[0].status, "candidate_found");

assert.deepEqual(assertNoDuplicateObjectImages([{workId: "a", status: "object_image_unresolved"}]), []);
assert.throws(() => assertNoDuplicateObjectImages([
  {workId: "a", status: "object_image_accepted", selected: {sha256: "a".repeat(64)}},
  {workId: "b", status: "object_image_accepted", selected: {sha256: "a".repeat(64)}},
]), /duplicate object image SHA/);

console.log("two-level image resolution helper tests passed");
