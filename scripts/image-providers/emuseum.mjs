import {scoreCandidate} from "./shared.mjs";

export function discoverEmuseum({identity, images = []}) {
  return images.filter(item => /\/internal\/media\/dispatcher\//i.test(item.url ?? ""))
    .map((item, index) => scoreCandidate(identity, {
      id: `emuseum-${index + 1}`, ...item, provider: "emuseum",
      method: "official_emuseum", officialObjectRelation: true,
      mediaObjectIdRelation: Boolean(item.objectId),
    }));
}
