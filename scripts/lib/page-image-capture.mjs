// Shared page-image capture contract. A page element is evidence only when
// the visible image container, not the surrounding webpage, is captured.

export const PAGE_IMAGE_CAPTURE_TYPE = "clipped_image_container";

export function canonicalImageVariantUrl(value) {
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\.(?:small|medium|large)(?=\.[a-z0-9]+$)/i, "");
    return url.href;
  } catch {
    return String(value || "").replace(/\.(?:small|medium|large)(?=\.[a-z0-9]+(?:$|[?#]))/i, "");
  }
}

export function chooseCaptureBox({elementBox, ancestors = [], minWidth = 140, minHeight = 120}) {
  const candidate = ancestors.find(item => item.clipsOverflow && item.rasterIntersections <= 1
    && item.box.width * item.box.height <= elementBox.width * elementBox.height * 4);
  const box = candidate?.box ?? elementBox;
  if (!box || box.width < minWidth || box.height < minHeight) {
    throw new Error("page image element has no usable single-image capture box");
  }
  return box;
}

export function isInvalidAcceptedCapture(selected, candidate) {
  if (selected?.method !== "ai_page_element_capture" || !selected.capture?.boundingBox || !candidate?.boundingBox) return false;
  const capture = selected.capture.boundingBox;
  const target = candidate.boundingBox;
  if (!capture.width || !capture.height || !target.width || !target.height) return true;
  return capture.width > target.width * 4 || capture.height > target.height * 4;
}

export async function locatePageImageCandidate(page, chosen) {
  const images = page.locator("img");
  if (chosen.url) {
    const target = new URL(chosen.url, page.url()).href;
    const index = await images.evaluateAll((elements, input) => {
      const canonical = value => {
        try {
          const url = new URL(value, document.baseURI);
          url.pathname = url.pathname.replace(/\.(?:small|medium|large)(?=\.[a-z0-9]+$)/i, "");
          return url.href;
        } catch { return ""; }
      };
      const targetCanonical = canonical(input);
      const records = elements.map((element, elementIndex) => {
        const urls = [element.currentSrc, element.src, element.getAttribute("src"), element.getAttribute("data-src")].filter(Boolean);
        const rect = element.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
        const overlapHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
        const exact = urls.some(value => { try { return new URL(value, document.baseURI).href === input; } catch { return false; } });
        const variant = urls.some(value => canonical(value) === targetCanonical);
        return {elementIndex, exact, variant, area: rect.width * rect.height, visibleArea: overlapWidth * overlapHeight};
      });
      const candidates = /\.small\.[a-z0-9]+(?:$|[?#])/i.test(input)
        ? records.filter(item => item.visibleArea >= item.area * 0.5 && item.area >= 140 * 120)
        : records.filter(item => item.variant);
      return candidates.sort((a, b) => b.visibleArea - a.visibleArea || b.area - a.area || Number(b.exact) - Number(a.exact))[0]?.elementIndex ?? -1;
    }, target);
    if (index >= 0) return images.nth(index);
  }
  if (Number.isInteger(chosen.elementIndex) && chosen.elementIndex < await images.count()) return images.nth(chosen.elementIndex);
  if (chosen.selector) {
    const locator = page.locator(chosen.selector);
    if (await locator.count() === 1) return locator;
  }
  throw new Error("page image element could not be rebound after navigation");
}

export async function dismissPageImageOverlays(page) {
  const button = page.getByRole("button", {name: /^(deny|deny all|reject all|decline|only necessary|neka|avvisa)$/i}).first();
  if (await button.count()) await button.click({timeout: 2000}).catch(() => {});
  await page.evaluate(() => {
    for (const element of document.querySelectorAll('#CybotCookiebotDialog,[role="dialog"]')) {
      const text = element.textContent || "";
      if (/cookie|consent/i.test(text) && getComputedStyle(element).position === "fixed") {
        element.style.setProperty("display", "none", "important");
      }
    }
  });
}

function rectToBox(rect, viewport) {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const right = Math.min(viewport.width, rect.right);
  const bottom = Math.min(viewport.height, rect.bottom);
  return {x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y)};
}

export async function capturePageImageElement(page, locator, {minWidth = 140, minHeight = 120} = {}) {
  await dismissPageImageOverlays(page);
  await locator.scrollIntoViewIfNeeded();
  const viewport = page.viewportSize() || {width: 1280, height: 900};
  const geometry = await locator.evaluate((element, viewportSize) => {
    const toBox = candidate => {
      const rect = candidate.getBoundingClientRect();
      const x = Math.max(0, rect.x);
      const y = Math.max(0, rect.y);
      const right = Math.min(viewportSize.width, rect.right);
      const bottom = Math.min(viewportSize.height, rect.bottom);
      return {x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y)};
    };
    const elementBox = toBox(element);
    const ancestors = [];
    let current = element.parentElement;
    for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
      const style = getComputedStyle(current);
      const box = toBox(current);
      const rasterIntersections = [...current.querySelectorAll("img")].filter(image => {
        const rect = image.getBoundingClientRect();
        const overlapWidth = Math.max(0, Math.min(rect.right, box.x + box.width) - Math.max(rect.left, box.x));
        const overlapHeight = Math.max(0, Math.min(rect.bottom, box.y + box.height) - Math.max(rect.top, box.y));
        return rect.width > 0 && rect.height > 0 && overlapWidth * overlapHeight >= rect.width * rect.height * 0.5;
      }).length;
      ancestors.push({box, rasterIntersections, clipsOverflow: /(hidden|clip)/i.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)});
    }
    return {elementBox, ancestors};
  }, viewport);
  const box = chooseCaptureBox({...geometry, minWidth, minHeight});

  await page.evaluate(captureBox => {
    for (const control of document.querySelectorAll("button,[role=\"button\"]")) {
      const rect = control.getBoundingClientRect();
      const overlaps = rect.right > captureBox.x && rect.left < captureBox.x + captureBox.width
        && rect.bottom > captureBox.y && rect.top < captureBox.y + captureBox.height;
      if (!overlaps) continue;
      let target = control;
      for (let depth = 0; target.parentElement && depth < 4; depth += 1) {
        const parent = target.parentElement;
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.width <= 200 && parentRect.height <= 200 && getComputedStyle(parent).position !== "static") {
          target = parent;
        } else break;
      }
      target.style.setProperty("display", "none", "important");
    }
  }, box);

  const bytes = await page.screenshot({type: "png", clip: box});
  return {
    bytes,
    capture: {
      captureType: PAGE_IMAGE_CAPTURE_TYPE,
      boundingBox: box,
      viewport,
      sourcePageUrl: page.url(),
    },
  };
}
