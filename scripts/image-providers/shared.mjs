export const normalizeIdentity = value => String(value ?? "")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[^a-z0-9\u3400-\u9fff]+/g, "");

export function identitySignals(identity, candidate) {
  const haystack = normalizeIdentity([
    candidate.url, candidate.alt, candidate.caption, candidate.objectId,
    candidate.accessionNumber, candidate.title, candidate.creator,
  ].filter(Boolean).join(" "));
  const signals = [];
  const accession = normalizeIdentity(identity.accessionNumber);
  const title = normalizeIdentity(identity.title);
  const creator = normalizeIdentity(identity.creator);
  if (accession && haystack.includes(accession)) signals.push("accession_number_match");
  if (title && haystack.includes(title)) signals.push("title_match");
  if (creator && haystack.includes(creator)) signals.push("creator_match");
  if (candidate.officialObjectRelation) signals.push("official_object_relation");
  if (candidate.iiifManifestRelation) signals.push("iiif_manifest_relation");
  if (candidate.jsonLdObjectRelation) signals.push("jsonld_object_relation");
  if (candidate.domCaptionRelation) signals.push("dom_caption_relation");
  if (candidate.mediaObjectIdRelation) signals.push("media_object_id_relation");
  return signals;
}

export function scoreCandidate(identity, candidate) {
  const signals = identitySignals(identity, candidate);
  let score = candidate.officialObjectRelation ? 120 : 30;
  score += signals.length * 24;
  if (candidate.provider === "iiif") score += 35;
  if (candidate.provider === "emuseum") score += 25;
  if ((candidate.width ?? 0) >= 400 && (candidate.height ?? 0) >= 250) score += 10;
  const generic = /logo|hero|banner|menu|ticket|icon|avatar|building|museum[-_ ]?exterior/i
    .test(`${candidate.url ?? ""} ${candidate.alt ?? ""} ${candidate.caption ?? ""}`);
  if (generic) score -= 160;
  return {...candidate, identitySignals: signals, genericHeroPenalty: generic, score};
}
