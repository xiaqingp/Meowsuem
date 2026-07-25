import assert from "node:assert/strict";
import {runPool} from "./run-generation-batch.mjs";

let active = 0;
let maximum = 0;
const values = await runPool([1, 2, 3, 4, 5, 6], 2, async value => {
  active += 1;
  maximum = Math.max(maximum, active);
  await new Promise(resolve => setTimeout(resolve, 10));
  active -= 1;
  return value * 2;
});
assert.deepEqual(values, [2, 4, 6, 8, 10, 12]);
assert.equal(maximum, 2);
await assert.rejects(() => runPool([1, 2, 3], 2, async value => {
  if (value === 2) throw new Error("fixture failure");
  return value;
}), /fixture failure/);
console.log("generation batch test passed: bounded concurrency and failure propagation verified");
