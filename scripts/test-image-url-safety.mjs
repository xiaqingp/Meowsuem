import assert from "node:assert/strict";
import {assertSafeRemoteUrl, fetchSafeImage} from "./image-providers/url-safety.mjs";

const publicLookup = async () => [{address: "93.184.216.34", family: 4}];
const privateLookup = async () => [{address: "127.0.0.1", family: 4}];
await assert.rejects(() => assertSafeRemoteUrl("file:///tmp/a.jpg", {lookup: publicLookup}), /scheme/);
await assert.rejects(() => assertSafeRemoteUrl("http://localhost/a.jpg", {lookup: publicLookup}), /host/);
await assert.rejects(() => assertSafeRemoteUrl("http://example.invalid/a.jpg", {lookup: privateLookup}), /resolution/);
await assertSafeRemoteUrl("https://example.org/a.jpg", {lookup: publicLookup});

const headers = values => ({get: name => values[name.toLowerCase()] ?? null});
const responses = [
  {status: 302, ok: false, headers: headers({location: "http://127.0.0.1/private.jpg"})},
];
await assert.rejects(
  () => fetchSafeImage("https://example.org/start", {
    lookup: publicLookup,
    fetchImpl: async () => responses.shift(),
  }),
  /unsafe remote host resolution/,
);

const bodyChunks = [new Uint8Array([1, 2, 3])];
const accepted = await fetchSafeImage("https://example.org/image.jpg", {
  lookup: publicLookup,
  fetchImpl: async () => ({
    status: 200,
    ok: true,
    headers: headers({"content-type": "image/jpeg", "content-length": "3"}),
    body: {
      getReader: () => ({
        read: async () => bodyChunks.length ? {done: false, value: bodyChunks.shift()} : {done: true},
        cancel: async () => {},
      }),
    },
  }),
});
assert.equal(accepted.type, "image/jpeg");
assert.equal(accepted.bytes.length, 3);
console.log("image URL safety tests passed");
