import fs from "node:fs/promises";

function parseWithTrailingContainerNoise(candidate) {
  let source = candidate;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return JSON.parse(source);
    } catch (error) {
      const position = Number(String(error.message).match(/position (\d+)/)?.[1]);
      if (!Number.isInteger(position)) return null;
      const before = source.slice(0, position).trimEnd();
      const tail = source.slice(position);
      const nextClose = tail.search(/[}\]]/);
      const noise = nextClose < 0 ? "" : tail.slice(0, nextClose);
      if (!/[}\]]$/.test(before) || !noise.trim() || /[,:{}\[\]"]/.test(noise)) return null;
      source = `${source.slice(0, position)}${tail.slice(nextClose)}`;
    }
  }
  return null;
}

export function parseModelJson(text) {
  const source = String(text).replace(/^\uFEFF/, "");
  const start = source.search(/[\[{]/);
  if (start < 0) throw new SyntaxError("model output does not contain JSON");
  const closing = source[start] === "{" ? "}" : "]";
  for (let end = source.lastIndexOf(closing); end > start; end = source.lastIndexOf(closing, end - 1)) {
    try {
      return JSON.parse(source.slice(start, end + 1));
    } catch {
      const recovered = parseWithTrailingContainerNoise(source.slice(start, end + 1));
      if (recovered !== null) return recovered;
    }
  }
  if (source[start] === "{") {
    for (let end = source.lastIndexOf("]"); end > start; end = source.lastIndexOf("]", end - 1)) {
      try {
        return JSON.parse(`${source.slice(start, end + 1)}}`);
      } catch {}
    }
  }
  throw new SyntaxError("model output contains incomplete JSON");
}

export const readModelJson = async file => parseModelJson(await fs.readFile(file, "utf8"));
