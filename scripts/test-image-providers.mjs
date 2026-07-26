import assert from "node:assert/strict";
import {discoverGenericHtml} from "./image-providers/generic-html.mjs";
import {discoverIiif} from "./image-providers/iiif.mjs";
import {discoverEmuseum} from "./image-providers/emuseum.mjs";
import {museumImageProviderConfig} from "./image-providers/registry.mjs";
import {discoverWikidataCommons, searchWikidataCommons} from "./image-providers/wikidata-commons.mjs";

const identity = {title: "Double Elvis", creator: "Andy Warhol", accessionNumber: "76.9"};
const iiif = discoverIiif({identity, manifests: [{
  serviceId: "https://images.example.org/iiif/76.9",
  label: "Double Elvis — Andy Warhol",
  width: 1200,
  height: 900,
}]});
assert.equal(iiif.length, 1);
assert.equal(iiif[0].provider, "iiif");
assert.ok(iiif[0].identitySignals.includes("iiif_manifest_relation"));

const emuseum = discoverEmuseum({identity, images: [{
  url: "https://art.seattleartmuseum.org/internal/media/dispatcher/29806/preview",
  alt: "Double Elvis by Andy Warhol, accession 76.9",
  width: 500,
  height: 346,
  objectId: "29806",
}]});
assert.equal(emuseum.length, 1);
assert.ok(emuseum[0].score > 100);

const generic = discoverGenericHtml({identity, page: {
  og: "https://museum.example.org/images/museum-hero-banner.jpg",
  images: [{
    url: "https://museum.example.org/images/double-elvis-76.9.jpg",
    alt: "Double Elvis, Andy Warhol",
    width: 900,
    height: 600,
  }],
}});
assert.equal(generic.length, 2);
assert.equal(generic.find(item => item.id === "og").genericHeroPenalty, true);
assert.ok(generic.find(item => item.id === "dom-1").score > generic.find(item => item.id === "og").score);

assert.deepEqual(
  museumImageProviderConfig("seattle", "https://art.seattleartmuseum.org/objects/3307").providerOrder.slice(0, 2),
  ["emuseum", "iiif"],
);
assert.equal(museumImageProviderConfig("new-museum", "https://collection.example.org/object/1").officialHosts[0], "collection.example.org");
const commonsRecords = await searchWikidataCommons({
  identity,
  fetchImpl: async () => ({
    ok: true,
    json: async () => ({query: {pages: {1: {
      title: "File:Double Elvis by Andy Warhol.jpg",
      imageinfo: [{thumburl: "https://upload.wikimedia.org/double-elvis.jpg", thumbwidth: 1200, thumbheight: 800, mime: "image/jpeg"}],
    }}}}),
  }),
});
const commons = discoverWikidataCommons({identity, records: commonsRecords});
assert.equal(commons.length, 1);
assert.ok(commons[0].identitySignals.includes("title_match"));
assert.equal(commons[0].provider, "wikidata-commons");
console.log("image provider fixtures passed: IIIF, eMuseum, generic HTML, Commons fallback, hero penalty and registry");
