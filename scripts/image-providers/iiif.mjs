import {scoreCandidate} from "./shared.mjs";

export function discoverIiif({identity, manifests = []}) {
  return manifests.flatMap((manifest, index) => {
    const url = manifest.serviceId
      ? `${String(manifest.serviceId).replace(/\/$/, "")}/full/max/0/default.jpg`
      : manifest.imageUrl ?? null;
    if (!url) return [];
    return [scoreCandidate(identity, {
      id: `iiif-${index + 1}`, url, width: manifest.width ?? 0, height: manifest.height ?? 0,
      title: manifest.label, provider: "iiif", method: "official_iiif",
      officialObjectRelation: true, iiifManifestRelation: true,
    })];
  });
}
