// Shared page-image capture contract. A page element is evidence only when
// the visible image container, not the surrounding webpage, is captured.

export const PAGE_IMAGE_CAPTURE_TYPE = "clipped_image_container";

function rectToBox(rect, viewport) {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const right = Math.min(viewport.width, rect.right);
  const bottom = Math.min(viewport.height, rect.bottom);
  return {x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y)};
}

export async function capturePageImageElement(page, locator, {minWidth = 20, minHeight = 20} = {}) {
  await locator.scrollIntoViewIfNeeded();
  const viewport = page.viewportSize() || {width: 1280, height: 900};
  const box = await locator.evaluate((element, viewportSize) => {
    const toBox = candidate => {
      const rect = candidate.getBoundingClientRect();
      const x = Math.max(0, rect.x);
      const y = Math.max(0, rect.y);
      const right = Math.min(viewportSize.width, rect.right);
      const bottom = Math.min(viewportSize.height, rect.bottom);
      return {x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y)};
    };
    let current = element.parentElement;
    for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
      const style = getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      if (/(hidden|clip)/i.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)
        && rect.width >= 20 && rect.height >= 20) return toBox(current);
    }
    return toBox(element);
  }, viewport);
  if (!box || box.width < minWidth || box.height < minHeight) {
    throw new Error("page image element has no usable clipped image container");
  }

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
