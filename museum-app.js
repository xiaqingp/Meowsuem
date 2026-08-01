// Shared production renderer for every museum.
const params = new URLSearchParams(location.search);
const requestedId = params.get("id");
const museumAliases = { chichuartmuseum: "chichu" };
const museumId = museumData[requestedId] ? requestedId : (museumAliases[requestedId] || "seattle");
const museum = museumData[museumId];
const $ = selector => document.querySelector(selector);
let currentWorkIndex = 0;
let currentRoute = museum.routes[params.get("route")] ? params.get("route") : "half";
let richSections = [];

if (requestedId !== museumId) {
  const canonical = new URL(location.href);
  canonical.searchParams.set("id", museumId);
  history.replaceState({}, "", canonical);
}

function escapeHtml(value) {
  return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const html = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => { if (paragraph.length) html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`); paragraph = []; };
  const closeList = () => { if (list) html.push(`</${list}>`); list = null; };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); closeList(); continue; }
    if (line === "---") { flushParagraph(); closeList(); html.push("<hr>"); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length === 1 ? 2 : 3; html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    if (line.startsWith(">")) { flushParagraph(); closeList(); html.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`); continue; }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const type = bullet ? "ul" : "ol";
      if (list !== type) { closeList(); list = type; html.push(`<${type}>`); }
      html.push(`<li>${inlineMarkdown((bullet || numbered)[1])}</li>`);
      continue;
    }
    closeList(); paragraph.push(line);
  }
  flushParagraph(); closeList();
  return html.join("");
}

function parseMuseumContent(markdown) {
  const matches = [...markdown.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
  const sections = matches.map((match, index) => {
    const nextWork = matches[index + 1]?.index ?? markdown.length;
    const nextChapter = markdown.indexOf("\n# ", match.index + match[0].length);
    const end = nextChapter >= 0 ? Math.min(nextWork, nextChapter) : nextWork;
    return {number:Number(match[1]), body:markdown.slice(match.index + match[0].length, end).trim()};
  });
  const afterStart = markdown.search(/^#\s+参观前/m);
  return {sections, after:afterStart >= 0 ? markdown.slice(afterStart).trim() : ""};
}

function cardSummary(work) {
  return work.cardSummary;
}

function displayDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function workUrl(work) {
  return `./museum.html?id=${encodeURIComponent(museum.id)}&work=${encodeURIComponent(work.id)}`;
}

function renderMuseum() {
  document.title = `Meowseum — ${museum.zh}`;
  $("#heroPhoto").style.backgroundImage = `url("${museum.hero}")`;
  $("#city").textContent = museum.city;
  $("#museumName").textContent = museum.zh;
  $("#museumEn").textContent = museum.en;
  $("#score").textContent = museum.score;
  $("#decisionTitle").textContent = museum.scoreBand;
  $("#ratingAnalysis").innerHTML = `<p>${museum.scoreReason}</p><p>${museum.withinBandReason}</p>`;
  $("#officialLink").href = $("#bottomOfficial").href = museum.official;
  $("#visitLink").href = $("#bottomVisit").href = museum.visit;
  $("#contentUpdated").textContent = `最近更新：${displayDate(museum.contentUpdatedAt)}`;
  const chapterNumerals = {5:"五",6:"六",7:"七",8:"八"};
  $("#navTitle").textContent = `${chapterNumerals[museum.chapters.length] || museum.chapters.length}章理解${museum.zh}`;
  $("#introText").innerHTML = museum.intro.map(paragraph => `<p>${paragraph}</p>`).join("");
  $("#navLinks").innerHTML = museum.chapters.map(chapter => `<a data-anchor="${chapter.id}" href="./museum.html?id=${encodeURIComponent(museum.id)}#${chapter.id}"><span>${chapter.number}</span>${chapter.title}</a>`).join("");
  $("#routeButtons").innerHTML = ["90", "half", "all"]
    .map(id => `<button class="route-button" data-route="${id}">${museum.routes[id].title}</button>`).join("");
  $("#chapters").innerHTML = museum.chapters.map(chapter => {
    const cards = museum.works.map((work, index) => ({work,index})).filter(item => item.work.ch === chapter.id).map(({work,index}) => `
      <a class="card ${work.unavailable ? "unavailable" : ""}" data-work="${index}" href="${workUrl(work)}">
        <div class="thumb">${work.imageKind === "image-unresolved" ? '<div class="thumb-empty">暂无可靠作品图</div>' : `<img src="${work.image || museum.hero}" alt="${work.zh}（${work.en}）" loading="lazy">`}${work.imageKind === "installation" ? '<span class="image-kind">展陈现场 · 非单件扫描</span>' : work.imageKind === "context-image" ? '<span class="image-kind">建筑 / 场域图 · 非作品图</span>' : work.imageKind === "museum-placeholder" || !work.image ? '<span class="image-kind">馆舍占位图 · 非作品图</span>' : ""}</div>
        <div class="card-body"><div class="card-top"><span class="num">${String(index + 1).padStart(2,"0")}</span><span class="card-tags"><span class="tag significance">${work.significance}</span><span class="tag">${work.tag}</span>${work.availabilityTag ? `<span class="tag">${work.availabilityTag}</span>` : ""}</span></div>
        <h3>${work.zh}</h3><div class="work-en">${work.en}</div><div class="art-details">${work.by} · ${work.date}</div><p class="card-summary">${cardSummary(work)}</p>
        <div class="meta"><span>${work.time}</span><span>${work.unavailable ? "仅阅读" : "开始阅读 →"}</span></div></div>
      </a>`).join("");
    return `<section class="chapter${chapter.id === "hidden" ? " hidden-gems" : ""}" id="${chapter.id}"><div class="chapter-head"><div class="eyebrow">${chapter.number}</div><h2>${chapter.title}</h2><p>${chapter.intro}</p></div><div class="grid">${cards}</div></section>`;
  }).join("");
}

function setRoute(routeId, updateUrl = false) {
  const route = museum.routes[routeId] || museum.routes.half;
  currentRoute = museum.routes[routeId] ? routeId : "half";
  document.querySelectorAll(".route-button").forEach(button => button.classList.toggle("active", button.dataset.route === currentRoute));
  $("#trayTitle").textContent = route.title;
  $("#trayNote").textContent = route.note;
  $("#routeStops").innerHTML = route.workIds.map((workId, index) => {
    const work = museum.works.find(item => item.id === workId);
    return `<div class="route-stop"><span class="n">${index + 1}</span><span>${work.zh}</span><span class="t">${work.time}</span></div>`;
  }).join("") + (currentRoute === "all" ? museum.works.filter(work => work.unavailable).map(work => `<div class="route-stop disabled"><span class="n">—</span><span>${work.zh}</span><span class="t">不可见</span></div>`).join("") : "");
  $("#routeCount").textContent = `${route.workIds.length} 件优先作品`;
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("id", museum.id);
    url.searchParams.set("route", currentRoute);
    url.searchParams.delete("work");
    url.hash = "";
    history.pushState({route:currentRoute}, "", url);
  }
}

function setWorkUrl(workId, mode = "push") {
  const url = new URL(location.href);
  url.searchParams.set("id", museum.id);
  url.searchParams.delete("route");
  if (workId) { url.searchParams.set("work", workId); url.hash = ""; }
  else { url.searchParams.delete("work"); url.searchParams.set("route", currentRoute); }
  history[`${mode}State`]({work:workId || null}, "", url);
}

const inlineWarningCodes = new Set(["UNSUPPORTED_DIRECT_QUOTE", "UNSUPPORTED_HIGH_RISK_CLAIM", "UNSUPPORTED_ARTIST_INTENT", "UNSUPPORTED_DISPLAY_STATUS"]);
const internalWarningCodes = new Set(["MISSING_REQUIRED_FILE", "FORBIDDEN_ARTIFACT", "INVALID_LOCKED_METADATA_JSON", "INVALID_SOURCES_JSON", "FORBIDDEN_METADATA_INPUT", "LOCKED_METADATA_SCHEMA", "SOURCES_SCHEMA", "MODEL_DRIFT", "REASONING_EFFORT_DRIFT", "SOURCE_IDENTITY_DRIFT", "EXPERIMENT_PUBLISH_ATTEMPT", "PROTECTED_FILE_SET_CHANGED", "PROTECTED_FILE_CHANGED", "REFERENCE_ID_LEAK", "INTERNAL_TEXT_LEAK", "BROAD_EVALUATION"]);
const smallWarningCodes = new Set(["LOW_SOURCE_COUNT", "INVALID_SOURCE_URL", "INVALID_SOURCE_TYPE", "ARTICLE_TITLE_DRIFT", "MISSING_QUICK_SECTION", "MISSING_FINAL_SECTION", "MISSING_MIDDLE_SECTION", "AMBIGUOUS_QUOTATION", "AMBIGUOUS_DISPLAY_STATUS"]);

function warningLevel(issue) {
  if (internalWarningCodes.has(issue.code)) return "internal";
  if (issue.code === "OFFICIAL_SOURCE_COVERAGE" && (issue.matches ?? []).every(value => ["date", "material"].includes(value))) return "small";
  return smallWarningCodes.has(issue.code) ? "small" : "large";
}

function warningMessage(issue) {
  if (issue.code === "OFFICIAL_SOURCE_COVERAGE" && issue.matches?.includes("material")) return "官方资料未注明或未充分支持这件作品的材质。";
  if (issue.code === "OFFICIAL_SOURCE_COVERAGE" && issue.matches?.includes("date")) return "官方资料未充分支持这件作品的年代。";
  const messages = {
    LOW_SOURCE_COUNT: "当前只记录了一个来源。",
    ARTICLE_TITLE_DRIFT: "正文标题格式与锁定名称不完全一致。",
    MISSING_QUICK_SECTION: "正文缺少“一分钟看懂”部分。",
    MISSING_MIDDLE_SECTION: "正文缺少中段分析。",
    MISSING_FINAL_SECTION: "正文缺少“最后再看一眼”部分。",
    AMBIGUOUS_QUOTATION: "部分引号可能是强调，也可能需要补充引语来源。",
    AMBIGUOUS_DISPLAY_STATUS: "展出状态的措辞仍不够明确。",
    UNSUPPORTED_DIRECT_QUOTE: "这段直接引语缺少可核验的来源记录。",
    UNSUPPORTED_HIGH_RISK_CLAIM: "这项强事实判断缺少可核验的来源记录。",
    UNSUPPORTED_ARTIST_INTENT: "这项艺术家意图判断缺少可核验的来源记录。",
    UNSUPPORTED_DISPLAY_STATUS: "这句话把尚未确认的展出状态写成了确定事实。",
    MISSING_OFFICIAL_OBJECT_SOURCE: "缺少可以确认作品身份的官方对象页。",
    BLOCKING_UPSTREAM_CONFLICT: "研究结果与锁定的作品资料存在重要冲突。"
  };
  return messages[issue.code] || issue.message;
}

function annotateInlineWarning(body, issue) {
  const matches = [...(issue.matches ?? [])];
  if (!matches.length && issue.code === "UNSUPPORTED_DISPLAY_STATUS") {
    const match = body.textContent.match(/(?:目前|当前|现正|正在)[^。！？\n]{0,28}(?:展出|在展|馆内看到)/)?.[0];
    if (match) matches.push(match);
  }
  for (const match of matches) {
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const index = node.data.indexOf(match);
      if (index < 0) continue;
      const before = node.data.slice(0, index);
      const after = node.data.slice(index + match.length);
      const marked = document.createElement("mark");
      marked.className = "inline-warning-claim";
      marked.textContent = match;
      const note = document.createElement("sup");
      note.className = "inline-warning-note";
      note.textContent = "⚠ 需核验";
      note.title = warningMessage(issue);
      node.replaceWith(document.createTextNode(before), marked, note, document.createTextNode(after));
      return true;
    }
  }
  return false;
}

function renderWorkWarnings(work, body) {
  const warningBox = $("#workWarning");
  const panel = warningBox.querySelector(".work-warning-panel");
  panel.replaceChildren();
  warningBox.open = false;
  const visible = [];
  for (const issue of work.contentWarning?.issues ?? []) {
    const level = warningLevel(issue);
    if (level === "internal") continue;
    if (inlineWarningCodes.has(issue.code) && annotateInlineWarning(body, issue)) continue;
    visible.push({...issue, level});
  }
  warningBox.hidden = visible.length === 0;
  if (!visible.length) return;
  const large = visible.some(issue => issue.level === "large");
  warningBox.className = `work-warning ${large ? "large" : "small"}`;
  warningBox.querySelector("summary").title = large ? "查看重要内容提示" : "查看资料提示";
  const title = document.createElement("strong");
  title.textContent = large ? "内容存在重要校验问题" : "资料提示";
  const list = document.createElement("ul");
  for (const issue of visible) {
    const item = document.createElement("li");
    item.textContent = warningMessage(issue);
    list.append(item);
  }
  panel.append(title, list);
}

function openWork(index, updateUrl = true) {
  currentWorkIndex = Number(index);
  const work = museum.works[currentWorkIndex];
  if (!work) return;
  if (updateUrl) setWorkUrl(work.id);
  document.title = `Meowseum — ${work.zh}`;
  $("#readerCount").textContent = `${currentWorkIndex + 1} / ${museum.works.length}`;
  $("#readerTag").textContent = [work.significance, work.tag, work.availabilityTag].filter(Boolean).join(" · ");
  $("#workTitle").textContent = work.zh;
  $("#workEn").textContent = work.en;
  $("#workMeta").textContent = `${work.by} · ${work.date} · ${work.place}`;
  const unresolvedImage = work.imageKind === "image-unresolved";
  $("#workImage").hidden = unresolvedImage;
  $("#workImage").src = unresolvedImage ? "" : (work.image || museum.hero);
  $("#workImage").alt = `${work.zh}（${work.en}）`;
  const placeholderCaption = unresolvedImage ? "暂无可靠作品图。" : work.imageKind === "museum-placeholder" || !work.image ? "馆舍占位图，不是本作品图。" : work.imageKind === "context-image" ? "建筑 / 场域图，不是本作品的独立对象图。" : "";
  $("#caption").innerHTML = `${placeholderCaption || work.imageCaption || `${work.zh}。`} <a href="${work.imageSource || museum.official}" target="_blank" rel="noreferrer">图片来源与许可</a> · <a href="${work.source}" target="_blank" rel="noreferrer">作品资料</a>`;
  const rich = richSections.find(section => section.number === currentWorkIndex + 1);
  $("#richBody").innerHTML = rich
    ? markdownToHtml(rich.body)
    : '<p class="content-error">完整正文尚未载入，请稍后重试。页面不会用摘要拼接替代正文。</p>';
  renderWorkWarnings(work, $("#richBody"));
  const publicSources = Array.isArray(work.sources) ? work.sources : [];
  const sourceDetails = $("#workSources");
  const sourceList = sourceDetails.querySelector("ul");
  sourceList.replaceChildren(...publicSources.map(source => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = [source.title, source.publisher].filter(Boolean).join(" · ");
    item.append(link);
    return item;
  }));
  sourceDetails.hidden = publicSources.length === 0;
  $("#sideTag").textContent = work.tag;
  $("#sideSignificance").textContent = `重要性：${work.significance}`;
  $("#sidePlace").textContent = `地点：${work.place}`;
  $("#sideAvailability").textContent = work.availabilityTag ? `展出状态：${work.availabilityTag}` : "";
  $("#sideTime").textContent = `建议停留：${work.time}`;
  $("#nextWork").textContent = `下一件：${museum.works[(currentWorkIndex + 1) % museum.works.length].zh} →`;
  $("#reader").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("#reader").scrollTo(0, 0);
}

function closeReader(updateUrl = true) {
  $("#reader").classList.add("hidden");
  document.body.style.overflow = "";
  document.title = `Meowseum — ${museum.zh}`;
  if (updateUrl) setWorkUrl(null, "replace");
}

function restoreChapterFromUrl() {
  const chapterId = decodeURIComponent(location.hash.slice(1));
  if (museum.chapters.some(chapter => chapter.id === chapterId)) requestAnimationFrame(() => document.getElementById(chapterId).scrollIntoView());
}

async function loadContent() {
  if (!museum.contentFile) return;
  try {
    const response = await fetch(museum.contentFile, {cache:"no-store"});
    if (!response.ok) throw new Error(response.status);
    const parsed = parseMuseumContent(await response.text());
    richSections = parsed.sections;
    if (parsed.after) { $("#afterContent").innerHTML = markdownToHtml(parsed.after); $("#afterContent").classList.remove("hidden"); }
  } catch (error) {
    console.error("rich content unavailable", error);
  }
}

renderMuseum();
setRoute(currentRoute);

document.addEventListener("click", event => {
  const chapter = event.target.closest("[data-anchor]");
  if (chapter) { event.preventDefault(); history.pushState({chapter:chapter.dataset.anchor}, "", chapter.href); return document.getElementById(chapter.dataset.anchor).scrollIntoView({behavior:"smooth"}); }
  const route = event.target.closest("[data-route]");
  if (route) return setRoute(route.dataset.route, true);
  const work = event.target.closest("[data-work]");
  if (work && !event.metaKey && !event.ctrlKey) { event.preventDefault(); return openWork(work.dataset.work); }
});

document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("#reader").classList.contains("hidden")) closeReader(); });
$("#closeReader").onclick = () => closeReader();
$("#nextWork").onclick = () => openWork((currentWorkIndex + 1) % museum.works.length);

addEventListener("popstate", () => {
  const stateParams = new URLSearchParams(location.search);
  const workIndex = museum.works.findIndex(work => work.id === stateParams.get("work"));
  if (workIndex >= 0) openWork(workIndex, false);
  else { closeReader(false); setRoute(stateParams.get("route") || "half"); restoreChapterFromUrl(); }
});

loadContent().then(() => {
  const initialWorkIndex = museum.works.findIndex(work => work.id === params.get("work"));
  if (initialWorkIndex >= 0) openWork(initialWorkIndex, false);
  else restoreChapterFromUrl();
});
