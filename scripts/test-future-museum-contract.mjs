import assert from "node:assert/strict";
import { validateFutureMuseumContract } from "./verify-future-museum-contract.mjs";

const baseInput = {
  schemaVersion: 1,
  integration: { coordinates: [1, 2] },
  museum: { id: "futuretest" },
  publication: { dataFile: "futuretest.js" },
};
const basePublication = {
  files: [
    { destination: "futuretest.js" },
    { destination: "index.html" },
    { destination: "museum.html" },
  ],
  cachePages: [],
};
const valid = {
  input: baseInput,
  dataSource: "museumData.futuretest = {works: []};",
  indexHtml:
    '<script src="./museums.js"></script><script src="./futuretest.js"></script><script>const museumLocations={futuretest:[1,2]};const order=["futuretest"];</script>',
  museumHtml:
    '<script src="./museums.js"></script><script src="./futuretest.js"></script><script src="./routes.js"></script>',
  publication: basePublication,
  runFiles: [],
  legacyMuseumIds: [],
};
assert.deepEqual(validateFutureMuseumContract(valid), []);
for (const [name, fixture, expected] of [
  ["binding", { ...valid, input: { ...baseInput, binding: "const" } }, "binding configuration is forbidden"],
  [
    "order",
    {
      ...valid,
      museumHtml:
        '<script src="./futuretest.js"></script><script src="./museums.js"></script><script src="./routes.js"></script>',
    },
    "must load after museums.js",
  ],
  [
    "map",
    {
      ...valid,
      indexHtml:
        '<script src="./museums.js"></script><script src="./futuretest.js"></script><script>const museumLocations={};const order=["futuretest"];</script>',
    },
    "map coordinates missing",
  ],
  ["builder", { ...valid, runFiles: ["build-candidate.mjs"] }, "museum-specific builder is forbidden"],
]) {
  const failures = validateFutureMuseumContract(fixture);
  assert(failures.some((failure) => failure.includes(expected)), `${name} fixture was not rejected`);
}

process.stdout.write("future museum contract test passed: binding, order, map and builder violations rejected\n");
