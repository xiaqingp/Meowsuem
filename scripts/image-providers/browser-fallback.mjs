import {discoverGenericHtml} from "./generic-html.mjs";

export function discoverBrowserFallback(input) {
  return discoverGenericHtml(input).map(item => ({...item, provider: "browser-fallback"}));
}
