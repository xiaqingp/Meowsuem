import {scoreCandidate} from "./shared.mjs";

export function discoverCollectionApi({identity, records = []}) {
  return records.filter(record => record.imageUrl).map((record, index) => scoreCandidate(identity, {
    id: `api-${index + 1}`, url: record.imageUrl, ...record,
    provider: "collection-api", method: "official_collection_api",
    officialObjectRelation: true, jsonLdObjectRelation: Boolean(record.jsonLd),
  }));
}
