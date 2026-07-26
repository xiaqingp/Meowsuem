import {scoreCandidate} from "./shared.mjs";

export function discoverWikidataCommons({identity, records = []}) {
  return records.filter(record => record.imageUrl).map((record, index) => scoreCandidate(identity, {
    id: `commons-${index + 1}`, url: record.imageUrl, ...record,
    provider: "wikidata-commons", method: "wikimedia_commons",
    officialObjectRelation: false,
  }));
}

export async function searchWikidataCommons({identity, fetchImpl = fetch, limit = 8}) {
  const query = [identity.title, identity.creator].filter(Boolean).join(" ");
  if (!query) return [];
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrsearch", `filetype:bitmap ${query}`);
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", String(limit));
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|size");
  api.searchParams.set("iiurlwidth", "1600");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  const response = await fetchImpl(api, {headers: {"user-agent": "Meowseum-image-evidence/2.11"}});
  if (!response.ok) return [];
  const data = await response.json();
  return Object.values(data?.query?.pages ?? {}).flatMap(page => {
    const info = page.imageinfo?.[0];
    if (!info?.url && !info?.thumburl) return [];
    return [{
      imageUrl: info.thumburl ?? info.url,
      title: page.title?.replace(/^File:/i, ""),
      creator: "",
      width: info.thumbwidth ?? info.width ?? 0,
      height: info.thumbheight ?? info.height ?? 0,
      contentType: info.mime ?? "",
      commonsPageUrl: info.descriptionurl ?? null,
      identitySignals: ["commons_search_title_creator_query"],
    }];
  });
}
