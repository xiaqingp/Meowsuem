import dns from "node:dns/promises";
import net from "node:net";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/tiff",
]);

const blockedIpv4 = address => {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
    || a >= 224;
};

const blockedIpv6 = address => {
  const value = address.toLowerCase().split("%")[0];
  return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd")
    || /^fe[89ab]/.test(value) || value.startsWith("ff")
    || (value.startsWith("::ffff:") && blockedIpv4(value.slice(7)));
};

export async function assertSafeRemoteUrl(value, {lookup = dns.lookup} = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`unsafe remote URL: invalid URL ${value}`);
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`unsafe remote URL scheme: ${url.protocol}`);
  if (url.username || url.password) throw new Error("unsafe remote URL: credentials are forbidden");
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error(`unsafe remote host: ${hostname || "(empty)"}`);
  }
  const literalFamily = net.isIP(hostname);
  const addresses = literalFamily
    ? [{address: hostname, family: literalFamily}]
    : await lookup(hostname, {all: true, verbatim: true});
  if (!addresses.length) throw new Error(`unsafe remote host: ${hostname} resolved to no address`);
  for (const record of addresses) {
    const blocked = record.family === 4 ? blockedIpv4(record.address) : blockedIpv6(record.address);
    if (blocked) throw new Error(`unsafe remote host resolution: ${hostname} -> ${record.address}`);
  }
  return url;
}

export async function fetchSafeImage(value, {
  timeoutMs = 30_000,
  maxBytes = 30_000_000,
  maxRedirects = 5,
  fetchImpl = fetch,
  lookup,
} = {}) {
  let current = (await assertSafeRemoteUrl(value, {lookup})).href;
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/tiff,*/*;q=0.2",
          "user-agent": "Mozilla/5.0 MeowseumImageResolver/2.11",
        },
      });
    } finally {
      clearTimeout(timer);
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirect === maxRedirects) throw new Error("image redirect limit exceeded");
      const location = response.headers.get("location");
      if (!location) throw new Error(`image redirect ${response.status} has no location`);
      current = (await assertSafeRemoteUrl(new URL(location, current).href, {lookup})).href;
      continue;
    }
    if (!response.ok) throw new Error(`image returned ${response.status}`);
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxBytes) throw new Error(`image exceeds byte limit: ${contentLength}`);
    const type = String(response.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!allowedImageTypes.has(type)) throw new Error(`asset is not an allowed image MIME: ${type || "unknown"}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("image response has no body");
    const chunks = [];
    let size = 0;
    while (true) {
      const {done, value: chunk} = await reader.read();
      if (done) break;
      size += chunk.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error(`image exceeds byte limit: ${size}`);
      }
      chunks.push(Buffer.from(chunk));
    }
    if (!size) throw new Error("image is zero bytes");
    return {bytes: Buffer.concat(chunks), type, url: current};
  }
  throw new Error("image redirect resolution failed");
}
