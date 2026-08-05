import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {assertPathInside, loadManifest, resolveCanonicalRun} from "./lib/filesystem-contract.mjs";

const decodeHtml = value => String(value || "")
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", "\"")
  .replaceAll("&#39;", "'")
  .replaceAll("&#x27;", "'");
const normalize = value => decodeHtml(value)
  .normalize("NFKD")
  .replace(/\p{Diacritic}/gu, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();
const ignoredTokens = new Set(["the", "and", "with", "from", "of", "in", "a", "an", "at", "by", "to"]);
const tokens = value => normalize(value).split(" ").filter(token => token.length > 1 && !ignoredTokens.has(token));
const coverage = (needles, haystack) => {
  const found = new Set(tokens(haystack));
  return needles.length ? needles.filter(token => found.has(token)).length / needles.length : 0;
};
const creatorKey = value => tokens(value).filter(token => !["american", "native", "roman", "egyptian", "french", "peruvian", "african", "kingdom", "probably"].includes(token)).at(-1) || "";
const hostname = value => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
};
const scoreSearchResult = (result, identity, organizationHost = "") => {
  const titleTokens = tokens(identity.titleEn);
  const resultTitle = result.title || "";
  const resultImage = decodeURIComponent(result.image || "");
  const resultPage = result.url || "";
  const titleInLabel = coverage(titleTokens, resultTitle);
  const titleInImage = coverage(titleTokens, resultImage);
  const titleAcrossResult = coverage(titleTokens, `${resultTitle} ${resultImage}`);
  const creator = creatorKey(identity.artistOrCulture);
  const creatorMatch = creator && normalize(`${resultTitle} ${resultImage} ${resultPage}`).split(" ").includes(creator);
  const resultHost = hostname(resultPage);
  const officialMatch = organizationHost && (resultHost === organizationHost || resultHost.endsWith(`.${organizationHost}`));
  const commonsMatch = resultHost === "commons.wikimedia.org" && new URL(resultPage).pathname.startsWith("/wiki/File:");
  const trustedInstitutionalMatch = resultHost.endsWith(".edu")
    || resultHost.endsWith(".gov")
    || /(museum|gallery|archive|library)/.test(resultHost);
  const identityText = `${resultTitle} ${resultImage} ${resultPage}`;
  const accessionMatch = identity.identityAnchor && normalize(identityText).includes(normalize(identity.identityAnchor));
  const institutionMatch = identity.institution && coverage(tokens(identity.institution), identityText) >= 0.8;
  if (officialMatch) return titleAcrossResult >= 0.8 ? Math.round(100 + titleAcrossResult * 20 + titleInImage * 10) : 0;
  if (titleInLabel < 0.8) return 0;
  if (commonsMatch && creatorMatch && titleInImage >= 0.5) return Math.round(70 + titleInLabel * 15 + titleInImage * 10);
  if (trustedInstitutionalMatch && creatorMatch && titleInImage >= 0.5 && (accessionMatch || institutionMatch)) {
    return Math.round(60 + titleInLabel * 15 + titleInImage * 10 + (accessionMatch ? 20 : 10));
  }
  return 0;
};
const imageResponse = async url => {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: {"user-agent": "Mozilla/5.0 Meowseum/1.0", Range: "bytes=0-2047"}
    });
    return response.ok && (response.headers.get("content-type") || "").startsWith("image/") ? response : null;
  } catch {
    return null;
  }
};
const stripHtml = value => decodeHtml(String(value || "").replace(/<[^>]+>/g, " "));
const resolveUrl = (value, pageUrl) => {
  try {
    return new URL(decodeHtml(value), pageUrl).href;
  } catch {
    return "";
  }
};
const extractMetaImages = (html, pageUrl) => {
  const images = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (!/(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/i.test(tag)) continue;
    const match = tag.match(/content=["']([^"']+)["']/i);
    if (match) images.push(resolveUrl(match[1], pageUrl));
  }
  return [...new Set(images.filter(Boolean))];
};
const extractJsonLdImages = (html, pageUrl) => {
  const images = [];
  for (const script of html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || []) {
    const body = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const walk = value => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (!value || typeof value !== "object") return;
        for (const [key, child] of Object.entries(value)) {
          if (["image", "contentUrl", "thumbnailUrl"].includes(key)) {
            if (typeof child === "string") images.push(resolveUrl(child, pageUrl));
            else if (child && typeof child === "object") walk(child);
          } else {
            walk(child);
          }
        }
      };
      walk(JSON.parse(decodeHtml(body)));
    } catch {
      // Invalid JSON-LD must not block the remaining official-page strategies.
    }
  }
  return [...new Set(images.filter(Boolean))];
};
const extractIiifManifests = (html, pageUrl) => {
  const manifests = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (!/rel=["'][^"']*manifest[^"']*["']/i.test(tag) && !/type=["']application\/(?:ld\+json|json)[^"']*["']/i.test(tag)) continue;
    const match = tag.match(/href=["']([^"']+)["']/i);
    if (match && /manifest|iiif/i.test(match[1])) manifests.push(resolveUrl(match[1], pageUrl));
  }
  for (const match of html.matchAll(/["'](https?:\/\/[^"']+(?:iiif|manifest)[^"']*\.json(?:\?[^"']*)?)["']/gi)) {
    manifests.push(resolveUrl(match[1], pageUrl));
  }
  return [...new Set(manifests.filter(Boolean))];
};
const iiifImages = manifest => {
  const images = [];
  const add = value => {
    if (typeof value === "string" && /^https?:/i.test(value)) images.push(value);
    else if (value && typeof value === "object") add(value.id || value["@id"]);
  };
  add(manifest.thumbnail);
  for (const canvas of manifest.sequences?.[0]?.canvases || []) {
    for (const annotation of canvas.images || []) add(annotation.resource);
  }
  for (const canvas of manifest.items || []) {
    add(canvas.thumbnail);
    for (const page of canvas.items || []) {
      for (const annotation of page.items || []) {
        add(annotation.body);
        for (const service of annotation.body?.service || []) {
          const id = service.id || service["@id"];
          if (id) images.push(`${String(id).replace(/\/$/, "")}/full/1200,/0/default.jpg`);
        }
      }
    }
  }
  return [...new Set(images.filter(Boolean))];
};
const fetchJson = async url => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {"user-agent": "Meowseum/2.7 image resolver"}
    });
    return {status: response.ok ? "ok" : `http_${response.status}`, value: response.ok ? await response.json() : null};
  } catch {
    return {status: "network_error", value: null};
  }
};
const officialPageImages = async pageUrl => {
  try {
    const response = await fetch(pageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {"user-agent": "Mozilla/5.0 Meowseum/2.7"}
    });
    if (!response.ok) return {status: `http_${response.status}`, results: []};
    const html = await response.text();
    const results = [
      ...extractMetaImages(html, pageUrl).map(image => ({image, method: "official_metadata"})),
      ...extractJsonLdImages(html, pageUrl).map(image => ({image, method: "official_jsonld"}))
    ];
    for (const manifestUrl of extractIiifManifests(html, pageUrl)) {
      const manifest = await fetchJson(manifestUrl);
      if (manifest.value) {
        results.push(...iiifImages(manifest.value).map(image => ({
          image,
          method: "official_iiif",
          imageSource: manifestUrl
        })));
      }
    }
    return {status: "ok", results};
  } catch {
    return {status: "network_error", results: []};
  }
};
const flattenStrings = value => {
  const strings = [];
  const walk = child => {
    if (typeof child === "string") strings.push(child);
    else if (Array.isArray(child)) child.forEach(walk);
    else if (child && typeof child === "object") Object.values(child).forEach(walk);
  };
  walk(value);
  return strings;
};
const officialApiUrl = pageUrl => {
  try {
    const url = new URL(pageUrl);
    const match = url.pathname.match(/^\/objects\/([^/]+)/);
    return match ? `${url.origin}/objects/${match[1]}/json` : "";
  } catch {
    return "";
  }
};
const officialApiCandidateImages = (payload, apiUrl, identity) => {
  const strings = flattenStrings(payload);
  const recordText = strings.join(" ");
  const sameRecord = coverage(tokens(identity.titleEn), recordText) >= 0.8
    && normalize(recordText).includes(normalize(identity.identityAnchor));
  if (!sameRecord) return [];
  return [...new Set(strings
    .map(value => resolveUrl(value, apiUrl))
    .filter(value => /^https?:/i.test(value) && /(?:\.(?:avif|gif|jpe?g|png|webp)(?:\?|$)|\/(?:media|image|iiif|dispatcher)\/)/i.test(value)))];
};
const officialApiImages = async (pageUrl, identity) => {
  const apiUrl = officialApiUrl(pageUrl);
  if (!apiUrl) return {status: "not_applicable", results: []};
  const response = await fetchJson(apiUrl);
  if (!response.value) return {status: response.status, results: []};
  const images = officialApiCandidateImages(response.value, apiUrl, identity);
  if (!images.length) return {status: "identity_mismatch", results: []};
  return {
    status: "ok",
    results: images.map(image => ({image, imageSource: apiUrl, method: "official_api"}))
  };
};
let lastSearchAt = 0;
const searchImages = async query => {
  const waitMs = Math.max(0, 500 - (Date.now() - lastSearchAt));
  if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
  lastSearchAt = Date.now();
  try {
    const searchPage = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(10000),
      headers: {"user-agent": "Mozilla/5.0 Meowseum/1.0"}
    });
    const html = searchPage.ok ? await searchPage.text() : "";
    const vqd = html.match(/vqd=["']?([\d-]+)/)?.[1];
    if (!vqd) return {query, results: [], status: "provider_unavailable"};
    const response = await fetch(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}`, {
      signal: AbortSignal.timeout(10000),
      headers: {"user-agent": "Mozilla/5.0 Meowseum/1.0", referer: "https://duckduckgo.com/"}
    });
    const payload = response.ok ? await response.json() : {};
    return {query, results: Array.isArray(payload.results) ? payload.results : [], status: response.ok ? "ok" : `http_${response.status}`};
  } catch {
    return {query, results: [], status: "network_error"};
  }
};
const searchImagesBing = async query => {
  try {
    const response = await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&mkt=en-US&setlang=en-US&cc=us`, {
      signal: AbortSignal.timeout(10000),
      headers: {"user-agent": "Mozilla/5.0", "accept-language": "en-US,en;q=0.9"}
    });
    const html = response.ok ? await response.text() : "";
    const results = [];
    for (const match of html.matchAll(/\bm=["'](\{[\s\S]*?\})["']/g)) {
      try {
        const item = JSON.parse(decodeHtml(match[1]));
        if (item.purl && (item.murl || item.turl)) {
          results.push({title: item.t || "", url: item.purl, image: item.murl, thumbnail: item.turl});
        }
      } catch {
        // Ignore unrelated HTML attributes that happen to start with JSON.
      }
    }
    return {query, results, status: response.ok ? "ok" : `http_${response.status}`};
  } catch {
    return {query, results: [], status: "network_error"};
  }
};
let lastWikimediaAt = 0;
const wikimediaJson = async (host, params) => {
  const waitMs = Math.max(0, 2100 - (Date.now() - lastWikimediaAt));
  if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
  lastWikimediaAt = Date.now();
  const url = `${host}/w/api.php?${new URLSearchParams({...params, format: "json", origin: "*"})}`;
  let result = await fetchJson(url);
  if (result.status === "http_429") {
    await new Promise(resolve => setTimeout(resolve, 3100));
    lastWikimediaAt = Date.now();
    result = await fetchJson(url);
  }
  return result;
};
const claimString = claim => claim?.mainsnak?.datavalue?.value;
const identityFingerprint = identity => [
  identity.titleEn,
  identity.artistOrCulture,
  identity.date,
  identity.identityAnchor,
  identity.institution
].map(normalize).join("|");
const wikidataEntityCandidate = (entity, searchResult, identity) => {
  const label = searchResult?.label || entity.labels?.en?.value || "";
  const description = searchResult?.description || entity.descriptions?.en?.value || "";
  const titleCoverage = coverage(tokens(identity.titleEn), `${label} ${description}`);
  const accessions = (entity.claims?.P217 || []).map(claimString).filter(Boolean);
  const accessionMatch = identity.identityAnchor && accessions.some(value => normalize(value) === normalize(identity.identityAnchor));
  const filename = claimString(entity.claims?.P18?.[0]);
  if (!filename || titleCoverage < 0.8 || !accessionMatch) return null;
  return {
    image: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename.replaceAll(" ", "_"))}`,
    imageSource: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename.replaceAll(" ", "_"))}`,
    method: "wikidata_p18",
    identityEvidence: "wikidata_accession",
    identityScore: 150
  };
};
const searchWikidata = async identity => {
  const search = await wikimediaJson("https://www.wikidata.org", {
    action: "wbsearchentities",
    search: `${identity.titleEn} ${identity.artistOrCulture}`,
    language: "en",
    limit: "5"
  });
  const hits = search.value?.search || [];
  if (!hits.length) return {status: search.status, results: []};
  const entities = await wikimediaJson("https://www.wikidata.org", {
    action: "wbgetentities",
    ids: hits.map(item => item.id).join("|"),
    props: "claims|labels|descriptions",
    languages: "en"
  });
  const results = hits.map(hit => wikidataEntityCandidate(entities.value?.entities?.[hit.id] || {}, hit, identity)).filter(Boolean);
  return {status: entities.status === "ok" ? search.status : entities.status, results};
};
const commonsCandidate = (page, identity) => {
  const info = page.imageinfo?.[0];
  if (!info?.url) return null;
  const metadata = info.extmetadata || {};
  const metadataText = [
    page.title,
    metadata.ObjectName?.value,
    metadata.ImageDescription?.value,
    metadata.Artist?.value,
    metadata.DateTimeOriginal?.value,
    metadata.Institution?.value,
    metadata.Credit?.value,
    metadata.Source?.value
  ].map(stripHtml).join(" ");
  const titleCoverage = coverage(tokens(identity.titleEn), metadataText);
  const creator = creatorKey(identity.artistOrCulture);
  const creatorMatch = creator && tokens(metadataText).includes(creator);
  const accessionMatch = identity.identityAnchor && normalize(metadataText).includes(normalize(identity.identityAnchor));
  const institutionMatch = coverage(tokens(identity.institution), metadataText) >= 0.8;
  const year = String(identity.date || "").match(/\d{4}/)?.[0];
  const yearMatch = year && metadataText.includes(year);
  const uniqueNamedWork = titleCoverage >= 0.95 && creatorMatch && yearMatch;
  if (titleCoverage < 0.8 || !(accessionMatch || (institutionMatch && creatorMatch) || uniqueNamedWork)) return null;
  const score = accessionMatch ? 150 : institutionMatch ? 135 : 110;
  return {
    image: info.thumburl || info.url,
    imageSource: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
    method: "commons_api",
    identityEvidence: accessionMatch ? "commons_accession" : institutionMatch ? "commons_institution" : "commons_full_identity",
    identityScore: score
  };
};
const searchCommons = async identity => {
  const search = await wikimediaJson("https://commons.wikimedia.org", {
    action: "query",
    generator: "search",
    gsrsearch: `"${identity.titleEn}" ${identity.artistOrCulture}`,
    gsrnamespace: "6",
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1600"
  });
  const pages = Object.values(search.value?.query?.pages || {});
  return {
    status: search.status,
    resultCount: pages.length,
    results: pages.map(page => commonsCandidate(page, identity)).filter(Boolean)
  };
};
const fallbackCode = ({attempts, sawIdentityCandidate, sawBrokenImage}) => {
  if (sawBrokenImage) return "broken_image";
  if (sawIdentityCandidate) return "ambiguous_identity";
  if (attempts.some(attempt => attempt.status === "ok")) return "not_found";
  if (attempts.some(attempt => attempt.status === "http_403" || attempt.status === "http_401")) return "rights_or_access_blocked";
  return "provider_unavailable";
};
if (process.argv.includes("--self-test")) {
  const identity = {
    titleEn: "Sea Change",
    artistOrCulture: "Jackson Pollock",
    date: "1947",
    identityAnchor: "47.1",
    institution: "Seattle Art Museum"
  };
  const official = {title: "Sea Change - Works", url: "https://art.seattleartmuseum.org/objects/2742/sea-change", image: "https://cdn.example.org/dispatcher/76355"};
  const correct = {title: "Jackson Pollock Sea Change", url: "https://commons.wikimedia.org/wiki/File:Jackson_Pollock_Sea_Change.jpg", image: "https://upload.wikimedia.org/jackson-pollock-sea-change.jpg"};
  const wrongImage = {title: "Sea Change by Jackson Pollock", url: "https://commons.wikimedia.org/wiki/File:Jackson_Pollock_White_Light.jpg", image: "https://upload.wikimedia.org/jackson-pollock-white-light.jpg"};
  const genericWrong = {title: "Salt cellar", url: "https://example.org/tableware", image: "https://example.org/salt-cellar.jpg"};
  const officialHtml = `
    <meta property="og:image" content="/media/sea-change.jpg">
    <script type="application/ld+json">{"image":{"contentUrl":"https://cdn.example.org/sea-change-full.jpg"}}</script>
    <link rel="manifest" type="application/ld+json" href="/iiif/sea-change/manifest.json">
  `;
  const iiifFixture = {
    items: [{items: [{items: [{body: {id: "https://iiif.example.org/sea-change/full.jpg", service: [{id: "https://iiif.example.org/sea-change"}]}}]}]}]
  };
  const officialApiFixture = {
    title: "Sea Change",
    accessionNumber: "47.1",
    media: [{url: "https://museum.example.org/internal/media/dispatcher/123/preview"}]
  };
  const wikidataFixture = {
    labels: {en: {value: "Sea Change"}},
    descriptions: {en: {value: "painting by Jackson Pollock"}},
    claims: {
      P217: [{mainsnak: {datavalue: {value: "47.1"}}}],
      P18: [{mainsnak: {datavalue: {value: "Sea Change Pollock.jpg"}}}]
    }
  };
  const commonsFixture = {
    title: "File:Jackson Pollock Sea Change.jpg",
    imageinfo: [{
      url: "https://upload.wikimedia.org/sea-change.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Jackson_Pollock_Sea_Change.jpg",
      extmetadata: {
        ObjectName: {value: "Sea Change"},
        Artist: {value: "Jackson Pollock"},
        DateTimeOriginal: {value: "1947"},
        Institution: {value: "Seattle Art Museum"},
        Credit: {value: "Accession 47.1"}
      }
    }]
  };
  if (scoreSearchResult(official, identity, "seattleartmuseum.org") <= 0) throw new Error("image resolver self-test rejected an exact official work page");
  if (scoreSearchResult(correct, identity, "seattleartmuseum.org") <= 0) throw new Error("image resolver self-test rejected an exact Commons work match");
  if (scoreSearchResult(wrongImage, identity, "seattleartmuseum.org") !== 0) throw new Error("image resolver self-test accepted a different work image");
  if (scoreSearchResult(genericWrong, {titleEn: "Salt cellar", artistOrCulture: "Sapi, Sierra Leone"}, "seattleartmuseum.org") !== 0) throw new Error("image resolver self-test accepted an ambiguous generic object");
  if (extractMetaImages(officialHtml, "https://museum.example.org/object/1").length !== 1) throw new Error("official Open Graph fixture failed");
  if (extractJsonLdImages(officialHtml, "https://museum.example.org/object/1").length !== 1) throw new Error("official JSON-LD fixture failed");
  if (extractIiifManifests(officialHtml, "https://museum.example.org/object/1")[0] !== "https://museum.example.org/iiif/sea-change/manifest.json") throw new Error("official IIIF link fixture failed");
  if (iiifImages(iiifFixture).length !== 2) throw new Error("IIIF v3 fixture failed");
  if (officialApiCandidateImages(officialApiFixture, "https://museum.example.org/objects/1/json", identity).length !== 1) throw new Error("official collection API fixture failed");
  if (!wikidataEntityCandidate(wikidataFixture, {label: "Sea Change", description: "painting by Jackson Pollock"}, identity)) throw new Error("Wikidata accession fixture failed");
  if (!commonsCandidate(commonsFixture, identity)) throw new Error("Commons direct API fixture failed");
  if (commonsCandidate({...commonsFixture, title: "File:White Light.jpg", imageinfo: [{...commonsFixture.imageinfo[0], extmetadata: {ObjectName: {value: "White Light"}, Artist: {value: "Jackson Pollock"}, Institution: {value: "Seattle Art Museum"}}}]}, identity)) throw new Error("Commons wrong-work fixture was accepted");
  if (fallbackCode({attempts: [{status: "network_error"}, {status: "ok"}], sawIdentityCandidate: false, sawBrokenImage: false}) !== "not_found") throw new Error("provider isolation fixture failed");
  if (fallbackCode({attempts: [{status: "network_error"}], sawIdentityCandidate: false, sawBrokenImage: false}) !== "provider_unavailable") throw new Error("provider outage fixture failed");
  console.log("museum image resolver self-test passed: official metadata/API/IIIF, Wikidata, Commons, outage isolation and negative identity fixtures passed");
  process.exit(0);
}

const argument = name => process.argv.find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
const projectRoot = path.resolve(argument("--project-root") || new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const manifest = await loadManifest(projectRoot);
const {runRoot, descriptor} = await resolveCanonicalRun({
  projectRoot,
  manifest,
  runKind: argument("--kind"),
  museumId: argument("--museum"),
  caseId: argument("--case"),
  runId: argument("--run-id"),
  suppliedRunRoot: argument("--run-root"),
  writable: true
});

const requiredArgs = ["--hero", "--official", "--visit", "--data-file", "--content-file", "--cache-key"];
for (const name of requiredArgs) if (!argument(name)) throw new Error(`${name}=... is required`);
const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"));
const scope = await readJson(path.join(runRoot, "scope", "museum-scope.json"));
const candidates = await readJson(path.join(runRoot, "candidate-pool", "candidate-pool.json"));
const rating = await readJson(path.join(runRoot, "rating", "museum-rating.json"));
const plan = await readJson(path.join(runRoot, "structure", "museum-plan.json"));
if (descriptor.museumId && (plan.museum.id || scope.museum.id) !== descriptor.museumId) {
  throw new Error("Filesystem contract violation: assembly preparation museum identity drift");
}
const expectedContentFile = `research/content/${plan.museum.id || scope.museum.id}.md`;
if (argument("--content-file") !== expectedContentFile) {
  throw new Error(`Filesystem contract violation: --content-file must be ${expectedContentFile}`);
}
const hero = argument("--hero");
const organizationHost = hostname(argument("--official")).replace(/^www\./, "");
const contentUpdatedAt = scope.sources
  .map(item => item.accessedAt)
  .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value || ""))
  .sort()
  .at(-1);
if (!contentUpdatedAt) throw new Error("scope sources must provide an accessedAt date");

const candidateById = new Map(candidates.candidates.map(item => [item.id, item]));
const contexts = new Map();
for (const item of plan.works) {
  contexts.set(item.workId, await readJson(path.join(runRoot, "works", item.workId, "research", "work-context.json")));
}
let assetCache = {};
try {
  assetCache = await readJson(path.join(runRoot, "image-evidence", "asset-cache.json"));
} catch {
  // A cache is optional; official object-page resolution and the hero fallback remain available.
}
let imageEvidence = null;
try {
  imageEvidence = await readJson(path.join(runRoot, "image-evidence", "verified-image-evidence.json"));
  if (imageEvidence.museumId !== (plan.museum.id || scope.museum.id)) throw new Error("image evidence museum mismatch");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const imageEvidenceById = new Map((imageEvidence?.works || []).map(item => [item.workId, item]));

const resolveAsset = async item => {
  const candidate = candidateById.get(item.workId);
  if (!candidate?.identitySourceUrl) throw new Error(`missing identity source: ${item.workId}`);
  if (imageEvidence) {
    const evidence = imageEvidenceById.get(item.workId);
    if (!evidence) throw new Error(`verified image evidence is missing work: ${item.workId}`);
    if (evidence.status === "accepted" && evidence.selected?.localPath) {
      const localFile = path.resolve(projectRoot, evidence.selected.localPath);
      await assertPathInside(runRoot, localFile, {allowEqual: false});
      const bytes = await fs.readFile(localFile);
      const actualHash = crypto.createHash("sha256").update(bytes).digest("hex");
      if (actualHash !== evidence.selected.sha256) throw new Error(`image evidence hash mismatch: ${item.workId}`);
      const publicPath = `./assets/museums/${imageEvidence.museumId}/${path.basename(localFile)}`;
      return {
        id: item.workId,
        image: publicPath,
        imageSource: evidence.selected.url,
        source: candidate.identitySourceUrl,
        imageKind: "work",
        discoveryMethod: evidence.selected.decisionMethod || evidence.selected.method || "verified_image_evidence",
        identityEvidence: evidence.selected.evidenceId,
        localAssetSource: evidence.selected.localPath
      };
    }
    return {
      id: item.workId,
      image: hero,
      imageSource: argument("--official"),
      source: candidate.identitySourceUrl,
      imageKind: "museum-placeholder",
      discoveryMethod: "verified_image_evidence_fallback",
      fallbackCode: evidence.status,
      fallbackReason: evidence.reason || `image evidence status: ${evidence.status}`
    };
  }
  const context = contexts.get(item.workId);
  const identity = {
    ...context.identity,
    date: candidate.date,
    identityAnchor: candidate.objectNumber || candidate.identityAnchor || context.identity.identityAnchor,
    institution: scope.museum.nameEn
  };
  const fingerprint = identityFingerprint(identity);
  if (assetCache[item.workId]?.image) {
    const cache = assetCache[item.workId];
    const trustedCache = cache.discoveryMethod !== "exact_image_search"
      || ([2, 3].includes(cache.resolverVersion) && ["official_collection_page", "commons_exact_identity", "trusted_institutional_page"].includes(cache.identityEvidence));
    const identityStillMatches = cache.resolverVersion !== 3 || cache.identityFingerprint === fingerprint;
    if (trustedCache && identityStillMatches && await imageResponse(cache.image)) {
      return {
        id: item.workId,
        image: cache.image,
        imageSource: cache.imageSource || candidate.identitySourceUrl,
        source: candidate.identitySourceUrl,
        imageKind: "work",
        discoveryMethod: cache.discoveryMethod || "locked_cache",
        ...(cache.identityEvidence ? {identityEvidence: cache.identityEvidence} : {}),
        ...(cache.identityScore ? {identityScore: cache.identityScore} : {})
      };
    }
  }
  const searchAttempts = [];
  let sawIdentityCandidate = false;
  let sawBrokenImage = false;
  const official = await officialPageImages(candidate.identitySourceUrl);
  searchAttempts.push({provider: "official_page", status: official.status, resultCount: official.results.length});
  for (const result of official.results) {
    sawIdentityCandidate = true;
    if (await imageResponse(result.image)) {
      assetCache[item.workId] = {
        image: result.image,
        imageSource: result.imageSource || candidate.identitySourceUrl,
        discoveryMethod: result.method,
        identityEvidence: "official_collection_page",
        identityScore: 160,
        identityFingerprint: fingerprint,
        resolverVersion: 3
      };
      return {
        id: item.workId,
        image: result.image,
        imageSource: result.imageSource || candidate.identitySourceUrl,
        source: candidate.identitySourceUrl,
        imageKind: "work",
        discoveryMethod: result.method,
        identityEvidence: "official_collection_page",
        identityScore: 160
      };
    }
    sawBrokenImage = true;
  }
  const officialApi = await officialApiImages(candidate.identitySourceUrl, identity);
  searchAttempts.push({provider: "official_api", status: officialApi.status, resultCount: officialApi.results.length});
  for (const result of officialApi.results) {
    sawIdentityCandidate = true;
    if (!await imageResponse(result.image)) {
      sawBrokenImage = true;
      continue;
    }
    assetCache[item.workId] = {
      image: result.image,
      imageSource: result.imageSource,
      discoveryMethod: result.method,
      identityEvidence: "official_accession",
      identityScore: 170,
      identityFingerprint: fingerprint,
      resolverVersion: 3
    };
    return {
      id: item.workId,
      image: result.image,
      imageSource: result.imageSource,
      source: candidate.identitySourceUrl,
      imageKind: "work",
      discoveryMethod: result.method,
      identityEvidence: "official_accession",
      identityScore: 170
    };
  }
  const commons = await searchCommons(identity);
  searchAttempts.push({provider: "commons_api", status: commons.status, resultCount: commons.resultCount, matchedCount: commons.results.length});
  for (const result of commons.results) {
    sawIdentityCandidate = true;
    if (!await imageResponse(result.image)) {
      sawBrokenImage = true;
      continue;
    }
    assetCache[item.workId] = {...result, discoveryMethod: result.method, identityFingerprint: fingerprint, resolverVersion: 3};
    return {
      id: item.workId,
      image: result.image,
      imageSource: result.imageSource,
      source: candidate.identitySourceUrl,
      imageKind: "work",
      discoveryMethod: result.method,
      identityEvidence: result.identityEvidence,
      identityScore: result.identityScore
    };
  }
  const wikidata = await searchWikidata(identity);
  searchAttempts.push({provider: "wikidata", status: wikidata.status, resultCount: wikidata.results.length});
  for (const result of wikidata.results) {
    sawIdentityCandidate = true;
    if (!await imageResponse(result.image)) {
      sawBrokenImage = true;
      continue;
    }
    assetCache[item.workId] = {...result, discoveryMethod: result.method, identityFingerprint: fingerprint, resolverVersion: 3};
    return {
      id: item.workId,
      image: result.image,
      imageSource: result.imageSource,
      source: candidate.identitySourceUrl,
      imageKind: "work",
      discoveryMethod: result.method,
      identityEvidence: result.identityEvidence,
      identityScore: result.identityScore
    };
  }
  const searches = [
    {provider: "duckduckgo", run: searchImages, query: `site:${organizationHost} "${identity.titleEn}" "${identity.artistOrCulture}"`, evidence: "official_collection_page"},
    {provider: "bing", run: searchImagesBing, query: `site:${organizationHost} "${identity.titleEn}" "${identity.artistOrCulture}"`, evidence: "official_collection_page"},
    {provider: "duckduckgo", run: searchImages, query: `"${identity.titleEn}" "${identity.artistOrCulture}" "${identity.institution}" "${identity.identityAnchor}"`, evidence: "trusted_institutional_page"},
    {provider: "bing", run: searchImagesBing, query: `"${identity.titleEn}" "${identity.artistOrCulture}" "${identity.institution}" "${identity.identityAnchor}"`, evidence: "trusted_institutional_page"}
  ];
  for (const search of searches) {
    const discovery = await search.run(search.query);
    const ranked = discovery.results
      .map(result => ({result, score: scoreSearchResult(result, identity, organizationHost)}))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    searchAttempts.push({
      provider: search.provider,
      query: discovery.query,
      status: discovery.status,
      resultCount: discovery.results.length,
      matchedCount: ranked.length
    });
    if (ranked.length) sawIdentityCandidate = true;
    for (const {result, score} of ranked) {
      for (const image of [result.image, result.thumbnail].filter(Boolean)) {
        if (!await imageResponse(image)) {
          sawBrokenImage = true;
          continue;
        }
        assetCache[item.workId] = {
          image,
          imageSource: result.url,
          discoveryMethod: "exact_image_search",
          query: discovery.query,
          identityScore: score,
          identityEvidence: search.evidence,
          identityFingerprint: fingerprint,
          resolverVersion: 3
        };
        return {
          id: item.workId,
          image,
          imageSource: result.url,
          source: candidate.identitySourceUrl,
          imageKind: "work",
          discoveryMethod: "exact_image_search",
          identityScore: score,
          identityEvidence: search.evidence
        };
      }
    }
  }
  const failureCode = fallbackCode({attempts: searchAttempts, sawIdentityCandidate, sawBrokenImage});
  return {
    id: item.workId,
    image: hero,
    imageSource: argument("--official"),
    source: candidate.identitySourceUrl,
    imageKind: "museum-placeholder",
    discoveryMethod: "museum_hero_fallback",
    searchAttempts,
    fallbackCode: failureCode,
    fallbackReason: failureCode === "provider_unavailable"
      ? "all independent image providers were unavailable; retry this work later"
      : failureCode === "rights_or_access_blocked"
        ? "identity source exists but image access is blocked"
        : failureCode === "ambiguous_identity"
          ? "candidate images were found but none proved the same collection object"
          : failureCode === "broken_image"
            ? "an identity-matched candidate was found but its image bytes were unusable"
            : "available official, Wikidata, Commons and search sources returned no identity-matched work image"
  };
};

const assets = [];
for (const item of plan.works) assets.push(await resolveAsset(item));
const assetById = new Map(assets.map(item => [item.id, item]));

const route = (source, fallbackIds) => ({
  title: source.title,
  note: source.strategy,
  workIds: source.workIds || source.visitOneWorkIds || fallbackIds
});
const allIds = plan.works.map(item => item.workId);
const routes = {
  "90": route(plan.routes.ninetyMinutes, allIds),
  half: route(plan.routes.halfDay, allIds),
  all: route(plan.routes.complete, allIds)
};
const shortAction = rating.score >= 90 ? "值得专程旅行"
  : rating.score >= 80 ? "值得纳入行程"
    : rating.score >= 70 ? "可去可不去"
      : rating.score >= 60 ? "只适合特定兴趣" : "建议略过";
const ratingOutput = {
  score: rating.score,
  scoreBand: rating.scoreBand,
  shortAction,
  travelAction: plan.rating.travelVerdict,
  scoreReason: rating.scoreReason,
  withinBandReason: rating.withinBandReason,
  rareAssets: rating.rareAssets,
  independentRareLines: rating.independentRareLines,
  peakLines: rating.peakLines,
  independentPeakLines: rating.independentPeakLines,
  worldDominantConcentration: rating.worldDominantConcentration,
  worldDominantConcentrationEvidence: rating.worldDominantConcentrationEvidence,
  dedicatedTrip: rating.dedicatedTrip,
  calibratedAgainst: ["glyptotek", "louvre", "met", "muxin", "seattle"],
  sources: scope.sources.map(item => item.url)
};
const works = [];
for (const item of plan.works) {
  const asset = assetById.get(item.workId);
  const writingPlan = await readJson(path.join(runRoot, "works", item.workId, "author", "writing-plan.json"));
  const draft = await fs.readFile(path.join(runRoot, "works", item.workId, "author", "draft.md"), "utf8");
  const heading = draft.match(/^##\s+(.+?)\s+\/\s+(.+)$/m);
  if (!heading) throw new Error(`missing bilingual heading: ${item.workId}`);
  works.push({
    id: item.workId,
    ch: item.sectionId,
    significance: item.significance,
    availabilityTag: item.availability,
    image: asset.image,
    imageSource: asset.imageSource,
    imageCaption: `${heading[1]}，${writingPlan.displayMetadata.by}，${writingPlan.displayMetadata.date}。`,
    imageKind: asset.imageKind,
    source: asset.source,
    ...(asset.localAssetSource ? {localAssetSource: asset.localAssetSource} : {})
  });
}
const assemblyInput = {
  schemaVersion: 1,
  proseTransforms: {removeLegacyDetailHeading: false},
  metadataFields: {includeMaterial: true},
  museum: {
    id: plan.museum.id || scope.museum.id,
    editorialCapacity: works.length,
    city: `${plan.museum.city} · 美国`,
    zh: plan.museum.nameZh,
    en: plan.museum.nameEn,
    verdict: "",
    hero,
    contentFile: argument("--content-file"),
    official: argument("--official"),
    visit: argument("--visit"),
    cardCopyContract: "independent-v1",
    contentUpdatedAt,
    intro: [plan.editorialThesis],
    routes
  },
  chapters: plan.sections.map((section, index) => ({
    id: section.id,
    number: String(index + 1).padStart(2, "0"),
    title: section.title,
    intro: section.summary
  })),
  routes,
  rating: ratingOutput,
  works,
  publication: {
    dataFile: argument("--data-file"),
    cacheKey: argument("--cache-key"),
    cachePages: ["index.html", "museum.html"]
  }
};
await fs.writeFile(path.join(runRoot, "image-evidence", "verified-assets.json"), `${JSON.stringify(assets, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(runRoot, "image-evidence", "asset-cache.json"), `${JSON.stringify(assetCache, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(runRoot, "structure", "assembly-input.json"), `${JSON.stringify(assemblyInput, null, 2)}\n`, "utf8");
console.log(`prepared assembly input: ${plan.museum.id || scope.museum.id}, ${works.length} works, ${assets.filter(item => item.imageKind === "museum-placeholder").length} placeholders`);
