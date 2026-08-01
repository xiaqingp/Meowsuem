import crypto from "node:crypto";

export const OBJECT_STATUSES = new Set([
  "object_image_accepted",
  "context_image_accepted",
  "object_image_unresolved",
  "provider_unavailable",
]);

export const normalize = value => String(value ?? "")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[^a-z0-9\u3400-\u9fff]+/g, "");

export function identityText(identity) {
  return [
    identity.titleEn,
    identity.titleZh,
    identity.creator,
    identity.artistOrCulture,
    identity.displayDate,
    identity.medium,
    identity.accessionNumber,
  ].filter(Boolean).join(" ");
}

export function pageIdentitySignals(identity, page) {
  const title = normalize(identity.titleEn || identity.titleZh);
  const creator = normalize(identity.creator || identity.artistOrCulture);
  const accession = normalize(identity.accessionNumber);
  const pageTitle = normalize(page.title);
  const body = normalize(page.body);
  const signals = [];
  if (accession && accession.length >= 4 && body.includes(accession)) signals.push("accession_number_match");
  if (title && pageTitle.includes(title) && creator && body.includes(creator)) signals.push("page_title_and_artist_match");
  if (page.jsonLdRecords?.some(record => normalize(record.name).includes(title) && normalize(record.creator).includes(creator))) {
    signals.push("jsonld_title_and_artist_match");
  }
  if (page.explicitRecords?.some(record => normalize(record.title).includes(title) && normalize(record.creator).includes(creator))) {
    signals.push("explicit_record_title_and_artist_match");
  }
  return signals;
}

export function imageIdentitySignals(identity, image) {
  const title = normalize(identity.titleEn || identity.titleZh);
  const creator = normalize(identity.creator || identity.artistOrCulture);
  const text = normalize([image.alt, image.caption, image.nearbyText, image.title, image.creator].filter(Boolean).join(" "));
  const signals = [];
  if (title && text.includes(title)) signals.push("title_match");
  if (creator && text.includes(creator)) signals.push("creator_match");
  if (image.jsonLdObjectRelation) signals.push("jsonld_object_relation");
  if (image.iiifManifestRelation) signals.push("iiif_manifest_relation");
  if (image.figureCaptionRelation) signals.push("figure_caption_relation");
  if (image.explicitRecordRelation) signals.push("explicit_record_relation");
  return signals;
}

export function isGenericContextImage(image) {
  return /logo|hero|banner|menu|ticket|icon|avatar|building|museum[-_ ]?(exterior|interior)|chichu[_-]?kv/i
    .test(`${image.url ?? ""} ${image.alt ?? ""} ${image.caption ?? ""} ${image.nearbyText ?? ""}`);
}

export function acceptFastCandidate(identity, page, image) {
  const pageSignals = pageIdentitySignals(identity, page);
  const imageSignals = imageIdentitySignals(identity, image);
  const context = isGenericContextImage(image);
  const pageHighConfidence = pageSignals.some(signal => [
    "accession_number_match",
    "page_title_and_artist_match",
    "jsonld_title_and_artist_match",
    "explicit_record_title_and_artist_match",
  ].includes(signal));
  const imageHighConfidence = imageSignals.some(signal => [
    "jsonld_object_relation",
    "iiif_manifest_relation",
    "figure_caption_relation",
    "explicit_record_relation",
  ].includes(signal)) || (imageSignals.includes("title_match") && imageSignals.includes("creator_match"));
  if (!pageHighConfidence || !imageHighConfidence || context) return null;
  return {
    ...image,
    identitySignals: [...pageSignals, ...imageSignals],
    method: image.method || "official_object_image",
    provider: image.provider || "generic-html",
  };
}

export function imageDimensions(bytes, contentType) {
  const type = String(contentType || "").toLowerCase();
  if (type === "image/png" && bytes.length >= 24 && bytes.toString("ascii", 1, 4) === "PNG") {
    return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
  }
  if (type === "image/gif" && bytes.length >= 10 && bytes.toString("ascii", 0, 3) === "GIF") {
    return {width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8)};
  }
  if (type === "image/webp" && bytes.length >= 25 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const kind = bytes.toString("ascii", 12, 16);
    if (kind === "VP8X" && bytes.length >= 30) {
      return {width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3)};
    }
    if (kind === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      return {width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff};
    }
    if (kind === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21);
      return {width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff)};
    }
  }
  if (type === "image/tiff" && bytes.length >= 16) {
    const little = bytes.toString("ascii", 0, 2) === "II";
    const big = bytes.toString("ascii", 0, 2) === "MM";
    if (little || big) {
      const u16 = offset => little ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset);
      const u32 = offset => little ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
      const ifd = u32(4);
      if (ifd + 2 <= bytes.length) {
        const count = u16(ifd);
        let width = 0;
        let height = 0;
        for (let index = 0; index < count; index += 1) {
          const entry = ifd + 2 + index * 12;
          if (entry + 12 > bytes.length) break;
          const tag = u16(entry);
          const kind = u16(entry + 2);
          const number = u32(entry + 4);
          const value = kind === 3 && number === 1 ? u16(entry + 8) : u32(entry + 8);
          if (tag === 256) width = value;
          if (tag === 257) height = value;
        }
        if (width && height) return {width, height};
      }
    }
  }
  if (type === "image/jpeg" && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3 || marker >= 0xc5 && marker <= 0xc7 || marker >= 0xc9 && marker <= 0xcb || marker >= 0xcd && marker <= 0xcf) {
        return {width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5)};
      }
      if (!length) break;
      offset += 2 + length;
    }
  }
  return null;
}

export function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function normalizeAiResult(value) {
  const works = Array.isArray(value?.works)
    ? value.works
    : Array.isArray(value?.decisions)
      ? value.decisions.map(item => ({
        workId: item.workId,
        status: item.status === "accepted" ? "candidate_found" : "not_found",
        selectedCandidate: item.selectedCandidate || (item.imageUrl ? {
          imageUrl: item.imageUrl,
          sourcePageUrl: item.sourcePageUrl,
          sourceType: "other",
          caption: item.caption || "",
          identityEvidence: item.evidence || [],
          confidence: item.confidence,
        } : null),
        limitations: item.status === "accepted" ? [] : [item.reason || "No reliable candidate returned"],
      }))
    : [];
  return {schemaVersion: 1, works};
}

export function assertNoDuplicateObjectImages(records) {
  const byHash = new Map();
  for (const record of records) {
    if (record.status !== "object_image_accepted" || !record.selected?.sha256) continue;
    const list = byHash.get(record.selected.sha256) || [];
    list.push(record.workId);
    byHash.set(record.selected.sha256, list);
  }
  const duplicateObjectImageGroups = [...byHash.entries()]
    .filter(([, workIds]) => workIds.length > 1)
    .map(([sha256, workIds]) => ({sha256, workIds}));
  if (duplicateObjectImageGroups.length) {
    throw new Error(`duplicate object image SHA detected: ${JSON.stringify(duplicateObjectImageGroups)}`);
  }
  return duplicateObjectImageGroups;
}
