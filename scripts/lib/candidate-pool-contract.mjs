const text = value => typeof value === "string" && value.trim().length > 0;

export function validateCandidatePool(candidatePool) {
  if (candidatePool?.schemaVersion !== 1 || !Array.isArray(candidatePool.candidates) || !candidatePool.candidates.length) {
    throw new Error("candidate pool must contain schemaVersion 1 and candidates");
  }
  const ids = new Set();
  for (const candidate of candidatePool.candidates) {
    const identity = candidate.identity;
    if (!text(candidate.workId) || ids.has(candidate.workId)) throw new Error("candidate workId is missing or duplicated");
    ids.add(candidate.workId);
    if (!text(identity?.title?.zh) || !text(identity?.title?.en)) {
      throw new Error(`${candidate.workId}: identity.title.zh and identity.title.en are required`);
    }
    const artist = text(identity.artistZh) && text(identity.artistEn);
    const culture = text(identity.cultureZh) && text(identity.cultureEn);
    if (!artist && !culture) throw new Error(`${candidate.workId}: bilingual artist or culture fields are required`);
    if (Object.hasOwn(identity, "artist")) throw new Error(`${candidate.workId}: unsupported identity.artist field`);
    for (const [field, value] of [
      ["objectType", identity.objectType],
      ["displayDate", identity.displayDate],
      ["medium", identity.medium],
      ["identityAnchor", identity.identityAnchor],
      ["officialObjectUrl", identity.officialObjectUrl],
      ["identitySourceUrl", candidate.identitySourceUrl],
    ]) if (!text(value)) throw new Error(`${candidate.workId}: ${field} is required`);
  }
  return candidatePool;
}
