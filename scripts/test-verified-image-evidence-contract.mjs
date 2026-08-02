import assert from "node:assert/strict";
import {validateVerifiedImageEvidence} from "./lib/verified-image-evidence-contract.mjs";

const selected = {url:"https://example.org/object.jpg",sourcePageUrl:"https://example.org/object",localPath:"run/assets/work.jpg",sha256:"a".repeat(64),width:800,height:600,contentType:"image/jpeg",method:"official_fast_path",provider:"official",identityEvidence:[]};
const work = {workId:"work-one",identity:{title:"Work One",identityAnchor:"A1",officialObjectUrl:"https://example.org/object"},status:"object_image_accepted",objectImageResolved:true,imagePolicy:"object_image",selected,warnings:[]};
const valid = {schemaVersion:2,museumId:"museum-one",works:[work]};
assert.deepEqual(validateVerifiedImageEvidence(valid), []);
assert(validateVerifiedImageEvidence({...valid,schemaVersion:1}).some(message => message.includes("schemaVersion")));
assert(validateVerifiedImageEvidence({...valid,works:[{...work,status:"object_image_unresolved"}]}).some(message => message.includes("selected must be null")));
assert(validateVerifiedImageEvidence({...valid,works:[{...work,selected:{...selected,identityEvidence:undefined}}]}).some(message => message.includes("identity evidence")));
process.stdout.write("verified image evidence contract tests passed\n");
