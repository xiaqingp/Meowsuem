import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {createGenerationRun} from "./create-generation-run.mjs";
import {lockedMetadataCompatible, reusePriorSingleWorks} from "./reuse-prior-single-work.mjs";

const projectRoot=path.resolve(new URL("..",import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,"$1"));
const museumId="reusefixture";
const oldRun=await createGenerationRun({projectRoot,kind:"production",museum:museumId,now:"2026-08-02T10:00:00Z"});
const newRun=await createGenerationRun({projectRoot,kind:"production",museum:museumId,now:"2026-08-02T10:01:00Z"});
const writeJson=(file,value)=>fs.mkdir(path.dirname(file),{recursive:true}).then(()=>fs.writeFile(file,`${JSON.stringify(value,null,2)}\n`));
const workId="same-work";
const oldWorkId="old-same-work";
const locked={
  schemaVersion:2,museumId,workId,objectType:"painting",titleZh:"同一作品",titleEn:"Same Work",
  displayBy:"测试作者 / Test Artist",artistZh:"测试作者",artistEn:"Test Artist",displayDate:"1900",medium:"布面油画",
  identityAnchor:"R.1",museumName:"复用测试馆",officialObjectUrl:"https://example.org/object/r1",
  significance:"重要藏品",priority:"强烈推荐",sectionId:"main",stay:"5分钟",availability:"display_status_unknown",
  imagePolicy:"object_image",verifiedImageUrl:"https://example.org/image/r1.jpg",
  verifiedImageLocalPath:"unused.jpg",verifiedImageSha256:"a".repeat(64),imageEvidencePath:"unused.json",
};
try {
  const oldDescriptor=JSON.parse(await fs.readFile(path.join(oldRun.runRoot,"run.json"),"utf8"));
  await writeJson(path.join(oldRun.runRoot,"run.json"),{...oldDescriptor,status:"published",immutable:true});
  await writeJson(path.join(oldRun.runRoot,"works",oldWorkId,"one-shot","input","locked-metadata.json"),{...locked,workId:oldWorkId});
  await writeJson(path.join(newRun.runRoot,"works",workId,"one-shot","input","locked-metadata.json"),locked);
  const oldArtifact=path.join(oldRun.runRoot,"works",oldWorkId,"one-shot");
  await fs.mkdir(path.join(oldArtifact,"output"),{recursive:true});
  await fs.writeFile(path.join(oldArtifact,"output","article.md"),"# 《同一作品》 / Same Work\n\n## 一分钟看懂\n\n这是一件用于验证复用链路的作品。\n\n## 为什么值得看\n\n它确认旧正文可以经过新一轮锁定资料重新校验。\n\n## 最后再看一眼\n\n回到作品本身。\n");
  await writeJson(path.join(oldArtifact,"output","sources.json"),{schemaVersion:2,museumId,workId:oldWorkId,sources:[{id:"S1",title:"Same Work",publisher:"Reuse Museum",url:locked.officialObjectUrl,sourceType:"museum",usedFor:["identity","date","material"]}],directQuotes:[],highRiskClaims:[],uncertainties:[],upstreamConflicts:[]});
  await writeJson(path.join(oldArtifact,"result.json"),{schemaVersion:2,status:"accepted",runId:oldRun.runId,museumId,workId:oldWorkId,stage:"single_work",attempt:1,model:"gpt-5.6-luna",reasoningEffort:"high"});
  await writeJson(path.join(newRun.runRoot,"reports","locked-metadata-report.json"),{works:[{workId}]});
  await writeJson(path.join(newRun.runRoot,"works",workId,"status.json"),{workId,status:"locked_input_ready",attempt:0});
  assert.equal(lockedMetadataCompatible(locked,{...locked,priority:"绝对不可错过",sectionId:"other"}),true);
  assert.equal(lockedMetadataCompatible(locked,{...locked,identityAnchor:"R.2"}),true);
  assert.equal(lockedMetadataCompatible(locked,{...locked,identityAnchor:"R.2",titleZh:"不同作品",titleEn:"Different Work"}),false);
  const report=await reusePriorSingleWorks({projectRoot,museum:museumId,runId:newRun.runId});
  assert.deepEqual(report.reused,[workId]);
  const result=JSON.parse(await fs.readFile(path.join(newRun.runRoot,"works",workId,"one-shot","result.json"),"utf8"));
  assert.equal(result.reused,true);
  assert.equal(result.totalTokens,0);
  assert.equal(result.reusedFromRunId,oldRun.runId);
  assert.equal(result.reusedFromWorkId,oldWorkId);
  console.log("prior single-work reuse passed: compatible output reverified with zero new model tokens");
} finally {
  const museumRoot=path.resolve(projectRoot,"research","runs","production",museumId);
  if (!museumRoot.startsWith(path.resolve(projectRoot,"research","runs","production")+path.sep)) throw new Error("unsafe fixture cleanup path");
  await fs.rm(museumRoot,{recursive:true,force:true});
}
