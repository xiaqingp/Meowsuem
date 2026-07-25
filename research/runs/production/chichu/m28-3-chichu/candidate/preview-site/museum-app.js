// Shared production renderer for every museum.
const params = new URLSearchParams(location.search);
const requestedId = params.get("id");
const museumId = museumData[requestedId] ? requestedId : "seattle";
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
        <div class="thumb"><img src="${work.image}" alt="${work.zh}（${work.en}）" loading="lazy">${work.imageKind === "installation" ? '<span class="image-kind">展陈现场 · 非单件扫描</span>' : ""}</div>
        <div class="card-body"><div class="card-top"><span class="num">${String(index + 1).padStart(2,"0")}</span><span class="card-tags"><span class="tag significance">${work.significance}</span><span class="tag">${work.tag}</span></span></div>
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

function openWork(index, updateUrl = true) {
  currentWorkIndex = Number(index);
  const work = museum.works[currentWorkIndex];
  if (!work) return;
  if (updateUrl) setWorkUrl(work.id);
  document.title = `Meowseum — ${work.zh}`;
  $("#readerCount").textContent = `${currentWorkIndex + 1} / ${museum.works.length}`;
  $("#readerTag").textContent = `${work.significance} · ${work.tag}`;
  $("#workTitle").textContent = work.zh;
  $("#workEn").textContent = work.en;
  $("#workMeta").textContent = `${work.by} · ${work.date} · ${work.place}`;
  $("#workImage").src = work.image;
  $("#workImage").alt = `${work.zh}（${work.en}）`;
  $("#caption").innerHTML = `${work.imageCaption || `${work.zh}。`} <a href="${work.imageSource}" target="_blank" rel="noreferrer">图片来源与许可</a> · <a href="${work.source}" target="_blank" rel="noreferrer">作品资料</a>`;
  const rich = richSections.find(section => section.number === currentWorkIndex + 1);
  $("#richBody").innerHTML = rich
    ? markdownToHtml(rich.body)
    : '<p class="content-error">完整正文尚未载入，请稍后重试。页面不会用摘要拼接替代正文。</p>';
  $("#sideTag").textContent = work.tag;
  $("#sideSignificance").textContent = `重要性：${work.significance}`;
  $("#sidePlace").textContent = `地点：${work.place}`;
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
