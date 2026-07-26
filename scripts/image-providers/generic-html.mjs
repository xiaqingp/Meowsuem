import {scoreCandidate} from "./shared.mjs";

export function discoverGenericHtml({identity, page}) {
  const items = [];
  if (page.og) items.push({
    id: "og", url: page.og, alt: "", width: 0, height: 0,
    method: "official_og_image", provider: "generic-html",
    officialObjectRelation: false,
  });
  for (const [index, image] of (page.images ?? []).entries()) {
    items.push({
      id: `dom-${index + 1}`, ...image,
      method: "official_rendered_image", provider: "generic-html",
      officialObjectRelation: true,
      domCaptionRelation: Boolean(image.alt),
    });
  }
  return items.map(item => scoreCandidate(identity, item));
}
