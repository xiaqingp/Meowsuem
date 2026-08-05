const normalize = value => String(value ?? "")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[()]/g, " ")
  .replace(/[^a-z0-9\p{L}]+/gu, " ")
  .trim()
  .replace(/\s+/g, " ");

const normalizedUrl = value => {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return url.href.replace(/\/$/, "").toLowerCase();
  } catch { return ""; }
};

const titleValues = identity => [
  identity?.titleEn, identity?.titleZh,
  typeof identity?.title === "string" ? identity.title : identity?.title?.en,
  identity?.title?.zh,
].map(normalize).filter(Boolean);

const titlesMatch = (left, right) => titleValues(left).some(a =>
  titleValues(right).some(b => a === b || (Math.min(a.length,b.length) >= 5 && (a.includes(b) || b.includes(a)))));

export function workIdentityMatches(left, right) {
  if (!left || !right) return false;
  if (left.museumId && right.museumId && left.museumId !== right.museumId) return false;
  const leftAccession=normalize(left.accessionNumber);
  const rightAccession=normalize(right.accessionNumber);
  if (leftAccession && rightAccession && leftAccession === rightAccession) return true;
  const leftAnchor=normalize(left.identityAnchor);
  const rightAnchor=normalize(right.identityAnchor);
  if (leftAnchor && rightAnchor && leftAnchor === rightAnchor) return true;
  if(left.museumId&&right.museumId&&titlesMatch(left,right)) return true;
  return titlesMatch(left,right)
    && normalizedUrl(left.officialObjectUrl || left.identitySourceUrl)
      === normalizedUrl(right.officialObjectUrl || right.identitySourceUrl);
}
