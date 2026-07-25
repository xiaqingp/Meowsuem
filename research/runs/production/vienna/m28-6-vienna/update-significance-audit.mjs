import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1"));
const runRoot = path.join(root, "research", "m28-6", "vienna");
const evidence = JSON.parse(fs.readFileSync(path.join(runRoot, "museum-selection", "museum-evidence.json"), "utf8"));
const auditPath = path.join(root, "research", "significance-evidence-v1.6.0.json");
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));

const context = { museumData: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "ratings.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "vienna.js"), "utf8"), context);
const museum = context.museumData.vienna;

const comparisonClasses = {
  "vienna-pg-01-tower-of-babel": "勃鲁盖尔同题《巴别塔》版本",
  "vienna-pg-02-hunters-in-the-snow": "勃鲁盖尔存世季节组画",
  "vienna-pg-06-art-of-painting": "维米尔寓意性室内画",
  "vienna-kk-01-saliera": "切利尼存世金匠与雕塑作品",
  "vienna-kk-07-rock-crystal-pyramid": "17世纪大型切磨水晶器",
  "vienna-kk-08-bellerophon-pegasus": "15世纪后期佛罗伦萨独立小型青铜",
  "vienna-ant-01-gemma-augustea": "古代大型宫廷浮雕宝石",
  "vienna-ant-02-nagyszentmiklos-treasure": "喀尔巴阡盆地迁徙时期至早期中世纪贵金属器群",
  "vienna-ant-04-bacchanalia-decree": "罗马共和国法律与公告铭文"
};
const boundaries = {
  "vienna-pg-01-tower-of-babel": "不声称它是唯一存世版本；全部历史复制品数量不能确认。",
  "vienna-pg-02-hunters-in-the-snow": "原六幅组画中一幅已佚；不把本作泛称为唯一冬景。",
  "vienna-pg-06-art-of-painting": "存世数量以当前约三十六幅归属为边界，不把争议归属算作定论。",
  "vienna-kk-01-saliera": "唯一性限于目前确认的切利尼存世金质作品；不扩张为跨作者质量排名。",
  "vienna-kk-07-rock-crystal-pyramid": "全球同类总数未知；唯一性只限作者现存签名纪年作品。",
  "vienna-kk-08-bellerophon-pegasus": "唯一性限于题材复兴与作者署名小雕像，不声称它是作者唯一存世雕塑。",
  "vienna-ant-01-gemma-augustea": "雕刻师、委托人及下层战事解释仍有争议。",
  "vienna-ant-02-nagyszentmiklos-treasure": "埋藏者、制作地、文字语言及是否同一工坊仍未知；整组只计一条珍品线。",
  "vienna-ant-04-bacchanalia-decree": "它是地方执行副本而非元老院母本，也不能证明李维叙述中的全部指控。"
};

const urlPattern = /https?:\/\/[^\s)>\]]+/g;
const cleanUrl = url => url.replace(/[；;，,。]+$/, "");
const records = evidence.works.filter(work => work.significance === "稀世珍品").map(work => {
  const researchPath = path.join(root, work.sourcePointers[0]);
  const research = fs.readFileSync(researchPath, "utf8");
  const sources = [...new Set((research.match(urlPattern) || []).map(cleanUrl))];
  const title = museum.works.find(item => item.id === work.workId)?.zh;
  if (!title || !sources.length || !comparisonClasses[work.workId] || !boundaries[work.workId]) {
    throw new Error(`incomplete significance record: ${work.workId}`);
  }
  return {
    museumId: "vienna",
    workId: work.workId,
    title,
    decision: "retain",
    comparisonClass: comparisonClasses[work.workId],
    closestComparator: work.nearestComparator,
    decisiveDifference: work.rareGateReason,
    irreplaceability: work.rareGateReason,
    evidenceBoundary: boundaries[work.workId],
    sources
  };
});

audit.auditDate = "2026-07-24";
audit.records = [...audit.records.filter(record => record.museumId !== "vienna"), ...records];
fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.log(`replaced Vienna significance audit with ${records.length} current records`);
