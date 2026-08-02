const ACCEPTED = new Set(["accepted", "object_image_accepted", "context_image_accepted"]);
const STATUS = new Set([...ACCEPTED, "object_image_unresolved", "provider_unavailable"]);
const POLICY = new Set(["object_image", "context_image", "museum_hero_placeholder", "none"]);
const CONTENT_TYPE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/tiff"]);
const slug = /^[a-z][a-z0-9-]*$/;
const hash = /^[a-f0-9]{64}$/;
const isUrl = value => { try { return /^https?:$/.test(new URL(value).protocol); } catch { return false; } };

export function validateVerifiedImageEvidence(document) {
  const failures = [];
  const fail = message => failures.push(message);
  if (document?.schemaVersion !== 2) fail("$.schemaVersion must be 2");
  if (!slug.test(document?.museumId || "")) fail("$.museumId must be a lowercase slug");
  if (!Array.isArray(document?.works)) return [...failures, "$.works must be an array"];
  const ids = new Set();
  for (const [index, work] of document.works.entries()) {
    const at = `$.works[${index}]`;
    if (!slug.test(work?.workId || "")) fail(`${at}.workId must be a lowercase slug`);
    if (ids.has(work?.workId)) fail(`${at}.workId is duplicated`); else ids.add(work?.workId);
    if (!work?.identity || typeof work.identity !== "object") fail(`${at}.identity is required`);
    else {
      if (typeof work.identity.title !== "string" || !work.identity.title) fail(`${at}.identity.title is required`);
      if (typeof work.identity.identityAnchor !== "string" || !work.identity.identityAnchor) fail(`${at}.identity.identityAnchor is required`);
      if (!isUrl(work.identity.officialObjectUrl)) fail(`${at}.identity.officialObjectUrl must be HTTP(S)`);
    }
    if (!STATUS.has(work?.status)) fail(`${at}.status is invalid`);
    if (!POLICY.has(work?.imagePolicy)) fail(`${at}.imagePolicy is invalid`);
    if (typeof work?.objectImageResolved !== "boolean") fail(`${at}.objectImageResolved must be boolean`);
    const selected = work?.selected;
    if (ACCEPTED.has(work?.status) && (!selected || typeof selected !== "object")) fail(`${at}.selected is required for accepted evidence`);
    if (!ACCEPTED.has(work?.status) && selected !== null) fail(`${at}.selected must be null for unresolved evidence`);
    if (work?.status === "object_image_accepted" && (work.imagePolicy !== "object_image" || work.objectImageResolved !== true)) fail(`${at} object image status/policy/resolution mismatch`);
    if (work?.status === "context_image_accepted" && (work.imagePolicy !== "context_image" || work.objectImageResolved !== false)) fail(`${at} context image status/policy/resolution mismatch`);
    if (["object_image_unresolved", "provider_unavailable"].includes(work?.status) && (work.imagePolicy !== "none" || work.objectImageResolved !== false)) fail(`${at} unresolved status/policy/resolution mismatch`);
    if (!selected || typeof selected !== "object") continue;
    if (selected.url !== null && !isUrl(selected.url)) fail(`${at}.selected.url must be HTTP(S) or null`);
    if (selected.sourcePageUrl !== undefined && !isUrl(selected.sourcePageUrl)) fail(`${at}.selected.sourcePageUrl must be HTTP(S)`);
    if (!selected.url && !selected.sourcePageUrl && !selected.capture?.sourcePageUrl) fail(`${at}.selected requires a source URL`);
    if (typeof selected.localPath !== "string" || !selected.localPath) fail(`${at}.selected.localPath is required`);
    if (!hash.test(selected.sha256 || "")) fail(`${at}.selected.sha256 is invalid`);
    if (!Number.isInteger(selected.width) || selected.width < 1 || !Number.isInteger(selected.height) || selected.height < 1) fail(`${at}.selected dimensions are invalid`);
    if (!CONTENT_TYPE.has(selected.contentType)) fail(`${at}.selected.contentType is invalid`);
    if (typeof selected.method !== "string" || !selected.method || typeof selected.provider !== "string" || !selected.provider) fail(`${at}.selected method/provider are required`);
    if (!Array.isArray(selected.identityEvidence) && !Array.isArray(selected.identitySignals)) fail(`${at}.selected identity evidence is required`);
    if (selected.method === "ai_page_element_capture") {
      const capture = selected.capture;
      if (selected.url !== null) fail(`${at}.selected.url must be null for element capture`);
      if (capture?.captureType !== "clipped_image_container") fail(`${at}.selected.capture.captureType is invalid`);
      if (!isUrl(capture?.sourcePageUrl)) fail(`${at}.selected.capture.sourcePageUrl must be HTTP(S)`);
      for (const field of ["x", "y", "width", "height"]) {
        const value = capture?.boundingBox?.[field];
        if (!Number.isFinite(value) || value < (["x", "y"].includes(field) ? 0 : Number.EPSILON)) fail(`${at}.selected.capture.boundingBox.${field} is invalid`);
      }
      for (const field of ["width", "height"]) if (!Number.isFinite(capture?.viewport?.[field]) || capture.viewport[field] <= 0) fail(`${at}.selected.capture.viewport.${field} is invalid`);
    }
  }
  return failures;
}

export function assertVerifiedImageEvidence(document) {
  const failures = validateVerifiedImageEvidence(document);
  if (failures.length) throw new Error(`verified image evidence contract failed:\n- ${failures.join("\n- ")}`);
  return document;
}
