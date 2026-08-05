import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {verifyRunCausality} from "./verify-run-causality.mjs";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const manifest = JSON.parse(await fs.readFile(path.join(projectRoot,"research/content-standard-manifest.json"),"utf8"));
const now = new Date();
now.setUTCSeconds(now.getUTCSeconds() + 2);
const fixedNow = now.toISOString();
const runId = `${fixedNow.replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z").replace("T","T")}-p${manifest.pipelineVersion}`;
const museumId = "microfixture";
const runRoot = path.join(projectRoot,"research","runs","production",museumId,runId);
const run = (script,args=[]) => {
  const result=spawnSync(process.execPath,[path.join(projectRoot,"scripts",script),...args],{cwd:projectRoot,encoding:"utf8"});
  if(result.status!==0) throw new Error(result.stderr||result.stdout);
  return result.stdout;
};
const writeJson=async(relative,value)=>{
  const file=path.join(runRoot,relative);
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,`${JSON.stringify(value,null,2)}\n`);
};
const sha=async file=>crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
const relative=file=>path.relative(projectRoot,file).replaceAll("\\","/");

try {
  run("create-generation-run.mjs",[
    "--kind=production",`--museum=${museumId}`,"--milestone=M31",`--now=${fixedNow}`,
  ]);
  const request={schemaVersion:1,museumId,museumName:"Micro Museum",city:"Test City",country:"Test Country",officialCollectionUrl:"https://example.org/collection",editorialCapacity:3};
  const scope={...request,coordinates:[1,2],collectionBoundaries:["fixture"],exclusions:[],riskFlags:[],sourcePointers:["https://example.org/collection"]};
  await writeJson("scope/request.json",request);
  await writeJson("scope/scope.json",scope);
  await fs.mkdir(path.join(runRoot,"understanding"),{recursive:true});
  await fs.writeFile(path.join(runRoot,"understanding","museum-understanding.md"),"# Micro Museum understanding\n\nFixture understanding with source: https://example.org/collection\n");

  const identities=[
    {workId:"ordinary-painting",objectType:"painting",title:{zh:"普通绘画",en:"Ordinary Painting"},titleZh:"普通绘画",titleEn:"Ordinary Painting",artistZh:"测试画家",artistEn:"Test Painter",displayDate:"1900年",medium:"布面油画",identityAnchor:"P.1",accessionNumber:"P.1",officialObjectUrl:"https://example.org/object/p1",riskFlags:[]},
    {workId:"historical-object",objectType:"historical_object",title:{zh:"历史文物",en:"Historical Object"},titleZh:"历史文物",titleEn:"Historical Object",cultureZh:"测试文化",cultureEn:"Test Culture",displayDate:"约公元前500年",medium:"石",identityAnchor:"H.1",accessionNumber:"H.1",officialObjectUrl:"https://example.org/object/h1",riskFlags:[]},
    {workId:"rare-candidate",objectType:"sculpture",title:{zh:"珍品候选",en:"Rare Candidate"},titleZh:"珍品候选",titleEn:"Rare Candidate",artistZh:"测试雕塑家",artistEn:"Test Sculptor",displayDate:"1500年",medium:"青铜",identityAnchor:"R.1",accessionNumber:"R.1",officialObjectUrl:"https://example.org/object/r1",riskFlags:["rare_candidate","superlative_claim"]},
  ];
  await writeJson("candidate-pool/candidate-pool.json",{
    schemaVersion:1,museumId,museumName:"Micro Museum",
    candidates:identities.map(item=>({workId:item.workId,identity:item,identitySourceUrl:item.officialObjectUrl,officialObjectUrl:item.officialObjectUrl,accessionNumber:item.accessionNumber,collectionGroup:"fixture",selectionRationale:"fixture",riskFlags:item.riskFlags,imageAvailability:"fixture"})),
  });
  await writeJson("research/batches/compact-01/compact-planning-evidence.json",{
    museumId,works:identities.slice(0,2).map(item=>({workId:item.workId,identityStatus:"stable",availability:"display_status_unknown",importanceCandidate:"重要藏品",rareCandidate:false,coreValue:"fixture",selectionSignals:[],sectionSignals:[],routeSignals:[],riskFlags:[],sourcePointers:[item.officialObjectUrl]})),
  });
  await writeJson("research/batches/deep-01/deep-research-dossier.json",{
    museumId,works:[{workId:"rare-candidate",identityStatus:"stable",rareCandidate:true,nearestComparator:"fixture comparator",sourcePointers:["https://example.org/rare-evidence"]}],
  });
  const selectedWorks=identities.map((item,index)=>({
    workId:item.workId,significance:"重要藏品",priority:index===2?"绝对不可错过":"强烈推荐",
    availability:"display_status_unknown",imagePolicy:"object_image",rareGatePassed:false,
    nearestComparator:null,independenceKey:null,
    parentOrWholeWorkId:null,ratingRole:"independent_object",identityStable:true,
    sourcePointers:[item.officialObjectUrl],
  }));
  const ratingInput={
    evidence:{museumId,works:selectedWorks},
    rating:{museumId,score:79,scoreBand:"70–79 · 可去可不去",withinBandAnchor:"78–79",scoreReason:"fixture",withinBandReason:"fixture",rareAssets:[],independentRareLines:[],peakLines:[],independentPeakLines:[],dedicatedTrip:false,worldDominantConcentration:false,worldDominantConcentrationEvidence:[]},
  };
  await writeJson("selection/selection.json",{schemaVersion:1,museumId,museumName:"Micro Museum",selectedWorks});
  await writeJson("selection/rating-input.json",ratingInput);
  const placements=identities.map((item,index)=>({workId:item.workId,sectionId:index===2?"rare":"main",stay:index===2?"8分钟":"5分钟",routeRole:["all"]}));
  const allWorkIds=identities.map(item=>item.workId);
  await writeJson("structure/structure.json",{
    schemaVersion:1,museumId,works:placements,
    museum:{name:{zh:"微型测试馆",en:"Micro Museum"},specialFocus:"fixture focus",actionConclusion:"fixture conclusion"},
    chapters:[
      {id:"main",number:"01",title:"主要作品",intro:"fixture",workIds:allWorkIds.slice(0,2)},
      {id:"rare",number:"02",title:"珍品",intro:"fixture",workIds:allWorkIds.slice(2)},
    ],
    routes:{
      "90":{title:"90分钟",note:"",workIds:allWorkIds},
      half:{title:"半天",note:"",workIds:allWorkIds},
      all:{title:"完整",note:"",workIds:allWorkIds},
    },
  });

  const imageSource=path.join(projectRoot,"assets","enoura","winter-tunnel.jpg");
  const evidenceWorks=[];
  for(const identity of identities){
    const asset=path.join(runRoot,"image-evidence","assets",`${identity.workId}.jpg`);
    await fs.mkdir(path.dirname(asset),{recursive:true});
    await fs.copyFile(imageSource,asset);
    evidenceWorks.push({
      workId:identity.workId,identity:{title:identity.titleEn,creator:identity.artistEn??identity.cultureEn,identityAnchor:identity.identityAnchor,accessionNumber:identity.accessionNumber,officialObjectUrl:identity.officialObjectUrl},
      status:"object_image_accepted",objectImageResolved:true,imagePolicy:"object_image",
      selected:{url:`https://example.org/image/${identity.workId}.jpg`,sourcePageUrl:identity.officialObjectUrl,localPath:relative(asset),sha256:await sha(asset),width:800,height:533,contentType:"image/jpeg",method:"fixture",provider:"fixture",identityEvidence:["accession_number_match"]},
      alternatives:[],warnings:[],
    });
  }
  await writeJson("image-evidence/verified-image-evidence.json",{schemaVersion:2,museumId,works:evidenceWorks,summary:{works:3,accepted:3}});

  const assemblyInput={
    schemaVersion:1,
    museum:{id:museumId,editorialCapacity:3,city:"Test City",zh:"微型测试馆",en:"Micro Museum",verdict:"",hero:"https://example.org/hero.jpg",contentFile:`research/content/${museumId}.md`,official:"https://example.org",visit:"https://example.org/visit",contentUpdatedAt:"2026-07-26",intro:["fixture"],routes:{},rareAssets:[]},
    chapters:[{id:"main",number:"01",title:"主要作品",intro:"fixture"},{id:"rare",number:"02",title:"珍品",intro:"fixture"}],
    routes:{"90":{title:"90分钟",note:"",workIds:identities.map(x=>x.workId)},half:{title:"半天",note:"",workIds:identities.map(x=>x.workId)},all:{title:"完整",note:"",workIds:identities.map(x=>x.workId)}},
    rating:{score:79},
    works:identities.map((item,index)=>({
      id:item.workId,ch:index===2?"rare":"main",significance:"重要藏品",
      image:`./assets/${museumId}/${item.workId}.jpg`,imageSource:`https://example.org/image/${item.workId}.jpg`,
      imageCaption:item.titleZh,source:item.officialObjectUrl,
      localAssetSource:evidenceWorks[index].selected.localPath,
    })),
    integration:{coordinates:[0,0]},
    publication:{dataFile:`${museumId}.js`,cacheKey:"microfixture-p2.11",cachePages:[]},
  };
  await writeJson("structure/assembly-input.json",assemblyInput);

  for(const item of identities){
    const root=path.join(runRoot,"works",item.workId,"one-shot","mock-output");
    await fs.mkdir(root,{recursive:true});
    await fs.writeFile(path.join(root,"article.md"),`# 《${item.titleZh}》 / ${item.titleEn}\n\n## 一分钟看懂\n\n这是一段用于验证完整流程的简明说明。\n\n## 为什么值得继续看\n\n它让夹具同时覆盖视觉作品、历史对象与高风险珍品候选。\n\n## 最后再看一眼\n\n回到作品本身，确认流程没有用旧稿替代新正文。\n`);
    await writeJson(`works/${item.workId}/one-shot/mock-output/sources.json`,{
      schemaVersion:2,museumId,workId:item.workId,
      sources:[{id:"S1",title:item.titleEn,publisher:"Micro Museum",url:item.officialObjectUrl,sourceType:"museum",usedFor:["identity","date","material"]}],
      directQuotes:[],highRiskClaims:[],uncertainties:[],upstreamConflicts:[],
    });
  }

  run("run-museum-pipeline.mjs",[`--museum=${museumId}`,`--run-id=${runId}`,"--mock"]);
  const result=JSON.parse(await fs.readFile(path.join(runRoot,"reports","orchestrator-result.json"),"utf8"));
  assert.equal(result.results.length,13);
  assert.ok(result.results.every(item=>item.status==="completed"));
  const descriptor=JSON.parse(await fs.readFile(path.join(runRoot,"run.json"),"utf8"));
  assert.equal(descriptor.status,"verified");
  assert.equal((await verifyRunCausality({projectRoot,kind:"production",museum:museumId,runId})).status,"passed");
  const expectedRoutes=[
    ["scope/run-header.json","gpt-5.6-luna","high"],
    ["understanding/run-header.json","gpt-5.6-sol","medium"],
    ["candidate-pool/run-header.json","gpt-5.6-sol","medium"],
    ["research/batches/compact-01/run-header.json","gpt-5.6-luna","high"],
    ["research/batches/deep-01/run-header.json","gpt-5.6-sol","medium"],
    ["selection/run-header.json","gpt-5.6-sol","medium"],
    ["structure/run-header.json","gpt-5.6-sol","medium"],
  ];
  for(const [file,model,effort] of expectedRoutes){
    const header=JSON.parse(await fs.readFile(path.join(runRoot,file),"utf8"));
    assert.equal(header.executionProfile.model,model,`${file} model`);
    assert.equal(header.executionProfile.reasoningEffort,effort,`${file} effort`);
  }
  for(const file of ["candidate-pool/run-header.json","selection/run-header.json","structure/run-header.json"]){
    const header=JSON.parse(await fs.readFile(path.join(runRoot,file),"utf8"));
    assert.ok(header.allowedInputs.some(input=>input.role==="museum_understanding"),`${file} museum understanding input`);
  }
  const selectionHeader=JSON.parse(await fs.readFile(path.join(runRoot,"selection/run-header.json"),"utf8"));
  assert.ok(selectionHeader.allowedInputs.some(input=>input.role==="museum_scope"),"selection/run-header.json museum scope input");
  assert.equal(manifest.modelRouting.image_disambiguation.model,"gpt-5.6-luna");
  assert.equal(manifest.modelRouting.image_disambiguation.reasoningEffort,"medium");
  const draftPath=path.join(runRoot,"works","ordinary-painting","one-shot","integration","draft.md");
  const draft=await fs.readFile(draftPath);
  await fs.appendFile(draftPath,"\ncausality tamper\n");
  assert.equal((await verifyRunCausality({projectRoot,kind:"production",museum:museumId,runId})).status,"failed");
  await fs.writeFile(draftPath,draft);
  assert.equal((await verifyRunCausality({projectRoot,kind:"production",museum:museumId,runId})).status,"passed");
  const candidateData=await fs.readFile(path.join(runRoot,"candidate",`${museumId}.js`),"utf8");
  assert.match(candidateData,/"sources":/);
  assert.ok(await fs.stat(path.join(runRoot,"candidate",`${museumId}.js`)));
  console.log("museum pipeline E2E fixture passed: 3 works, deterministic orchestration through publish dry-run");
} finally {
  await fs.rm(runRoot,{recursive:true,force:true});
  await fs.rmdir(path.dirname(runRoot)).catch(()=>{});
}
