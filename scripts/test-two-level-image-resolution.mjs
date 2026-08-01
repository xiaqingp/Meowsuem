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

const webpVp8 = Buffer.alloc(30);
webpVp8.write("RIFF", 0, "ascii"); webpVp8.write("WEBP", 8, "ascii"); webpVp8.write("VP8 ", 12, "ascii");
webpVp8.set([0x9d, 0x01, 0x2a], 23); webpVp8.writeUInt16LE(500, 26); webpVp8.writeUInt16LE(667, 28);
assert.deepEqual(imageDimensions(webpVp8, "image/webp"), {width: 500, height: 667});

const webpVp8l = Buffer.alloc(25);
webpVp8l.write("RIFF", 0, "ascii"); webpVp8l.write("WEBP", 8, "ascii"); webpVp8l.write("VP8L", 12, "ascii"); webpVp8l[20] = 0x2f;
webpVp8l.writeUInt32LE((499 & 0x3fff) | ((666 & 0x3fff) << 14), 21);
assert.deepEqual(imageDimensions(webpVp8l, "image/webp"), {width: 500, height: 667});

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
