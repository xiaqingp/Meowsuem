import assert from "node:assert/strict";
import {canonicalImageVariantUrl, chooseCaptureBox, isInvalidAcceptedCapture} from "./lib/page-image-capture.mjs";

assert.equal(
  canonicalImageVariantUrl("https://example.org/media/object.small.jpg"),
  canonicalImageVariantUrl("https://example.org/media/object.large.jpg"),
);
assert.deepEqual(chooseCaptureBox({
  elementBox: {x: 20, y: 20, width: 1200, height: 640},
  ancestors: [{box: {x: 20, y: 20, width: 1200, height: 640}, clipsOverflow: true, rasterIntersections: 1}],
}), {x: 20, y: 20, width: 1200, height: 640});
assert.throws(() => chooseCaptureBox({
  elementBox: {x: 500, y: 860, width: 79, height: 92},
  ancestors: [{box: {x: 20, y: 850, width: 1400, height: 120}, clipsOverflow: true, rasterIntersections: 10}],
}), /single-image capture box/);
assert.equal(isInvalidAcceptedCapture(
  {method: "ai_page_element_capture", capture: {boundingBox: {width: 1400, height: 120}}},
  {boundingBox: {width: 79, height: 92}},
), true);
assert.equal(isInvalidAcceptedCapture(
  {method: "ai_page_element_capture", capture: {boundingBox: {width: 1400, height: 671}}},
  {boundingBox: {width: 1400, height: 671}},
), false);

process.stdout.write("page image capture geometry tests passed\n");
