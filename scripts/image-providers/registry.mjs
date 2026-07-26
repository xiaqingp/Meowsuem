const configurations = new Map([
  ["seattle", {
    officialHosts: ["art.seattleartmuseum.org"],
    collectionPlatform: "emuseum",
    providerOrder: ["emuseum", "iiif", "generic-html", "browser-fallback", "wikidata-commons"],
  }],
]);

export function museumImageProviderConfig(museumId, officialObjectUrl) {
  const configured = configurations.get(museumId);
  if (configured) return {museumId, ...configured};
  let host = "";
  try { host = new URL(officialObjectUrl).hostname; } catch {}
  return {
    museumId,
    officialHosts: host ? [host] : [],
    collectionPlatform: "generic",
    providerOrder: ["iiif", "collection-api", "generic-html", "browser-fallback", "wikidata-commons"],
  };
}
