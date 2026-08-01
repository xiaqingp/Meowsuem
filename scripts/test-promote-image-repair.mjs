import assert from "node:assert/strict";
import {updateWorkImageFields} from "./promote-image-repair.mjs";

const fixture = `museumData["x"] = {\n  "works": [\n    {\n      "id": "one",\n      "image": "old.jpg",\n      "imageSource": "old",\n      "imageKind": "museum-placeholder"\n    },\n    {\n      "id": "two",\n      "image": "two.jpg",\n      "imageSource": "two",\n      "imageKind": "object"\n    }\n  ]\n};\n`;
const updated = updateWorkImageFields(fixture, "one", {image:"one.webp", imageSource:"official", imageKind:"object"});
assert.match(updated, /"image": "one\.webp"/); assert.match(updated, /"imageSource": "official"/); assert.match(updated, /"imageKind": "object"/); assert.match(updated, /"image": "two\.jpg"/);
assert.throws(() => updateWorkImageFields(fixture, "missing", {}), /published work missing/);
console.log("image repair promotion tests passed");
