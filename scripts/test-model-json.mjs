import assert from "node:assert/strict";
import {parseModelJson} from "./lib/model-json.mjs";

assert.deepEqual(parseModelJson('prefix {"value":"} inside string","items":[1,2]} trailing'), {
  value: "} inside string",
  items: [1, 2],
});
assert.deepEqual(parseModelJson('[{"ok":true}] extra'), [{ok: true}]);
assert.deepEqual(parseModelJson('{"text":"[brackets] and } braces","ok":true} x'), {
  text: "[brackets] and } braces",
  ok: true,
});
assert.deepEqual(parseModelJson('{"schemaVersion":2,"works":[{"ok":true}] stray'), {
  schemaVersion: 2,
  works: [{ok: true}],
});
assert.deepEqual(parseModelJson('{"schemaVersion":1,"works":[{"limitations":[] ситуация}]}'), {
  schemaVersion: 1,
  works: [{limitations: []}],
});
assert.throws(() => parseModelJson('{"works":[{"limitations":[] , broken}]}'), /incomplete JSON/);
assert.throws(() => parseModelJson('{"broken":true'), /incomplete JSON/);
assert.throws(() => parseModelJson('no structured output'), /does not contain JSON/);
console.log("model JSON extraction tests passed");
