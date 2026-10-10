// H2 TEST only. Run: node tests/h2-repair-guard-r1.cjs
// Runtime source under test: index.html, both embedded couple app cores.
// Does not call Gemini or modify SERVICE, history, storage, or user data.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const decode=t=>t.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const allScripts=[...decode(src).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
for(const [i,m] of allScripts.entries())assert.doesNotThrow(()=>new Function(m[1]),'Script syntax '+i);
assert.equal(allScripts.length,22,'Keep original script boundaries');
let checks=0;
const startMarker='SharedCriticalMeaningCoreV277=(()=&gt;{';
const starts=[...src.matchAll(/SharedCriticalMeaningCoreV277=\(\(\)=&gt;\{/g)].map(x=>x.index);
assert.equal(starts.length,2,'Both husband/wife cores must exist');
for(const start of starts){
 const end=src.indexOf('})();',start);
 assert.ok(end>start,'Core terminator');
 const section=decode(src.slice(start,end+4)).replace(
  "return Object.freeze({VERSION:'V2.77',detect,unexpectedLatin});",
  "return Object.freeze({VERSION:'V2.77',detect,unexpectedLatin,temporalEqual,temporalProfile});");
 const core=new Function('let '+section+';return SharedCriticalMeaningCoreV277;')();
 const fixtures=[
  ['한번 찾아보자','ລອງຊອກຫາວິທີ',true],
  ['한번 사 보세요','ລອງຊື້ເບິ່ງ',true],
  ['한번 확인해 보는 건 어떨까','ລອງກວດເບິ່ງ',true],
  ['9월에 한번 찾아보자','ເດືອນ 9 ລອງຊອກເບິ່ງ',true],
  ['9월에 한번 찾아보자','ເດືອນ 8 ລອງຊອກເບິ່ງ',false],
  ['3키로그램 쪘어','ຕຸ້ຍຂຶ້ນ 2 ກິໂລ',false],
  ['한번만 사줘','ຊື້ໃຫ້ແນ່',false],
  ['한번 더 찾아보자','ລອງຊອກເບິ່ງ',false],
  ['한 번 찾아보자','ລອງຊອກເບິ່ງ',false],
  ['두 번','ຄັ້ງ',false],
  ['세 명','ສາມ ຄົນ',true],
  ['9월','ເດືອນ 9',true],
  ['9월','ເດືອນ 8',false],
  ['3시 30분','3 ໂມງ 30 ນາທີ',true],
  ['3시 30분','3 ໂມງ 40 ນາທີ',false],
  ['한번도','ບໍ່ເຄີຍ',false],
  ['한개','ອັນດຽວ',true]
 ];
 for(const [ko,lo,expected] of fixtures){
  assert.equal(core.temporalEqual(ko,lo,'ko','lo'),expected,ko+' -> '+lo);
  checks++;
 }
 assert.equal(core.temporalEqual('ລອງຊອກເບິ່ງ','한번 찾아보자','lo','ko'),true);
 checks++;
}
for(const label of ['K2L','L2K']){
 const pattern="if(semanticRepairFailed&&(initialHardLatin.hard||initialHardDamage))throw makeCriticalSafetyError"+label+"({reasons:['OBJECTIVE_OUTPUT_CORRUPTION_REPAIR_FAILED']});";
 assert.equal(src.split(pattern).length-1,1,label+' fail-closed guard');
 checks++;
}
assert.equal((src.match(/const h2CountingAliasText/g)||[]).length,2);
assert.equal((src.match(/promptSha256/g)||[]).length>0,true);
console.log('PASS H2 TEST R1',JSON.stringify({source:'index.html',scriptBlocks:allScripts.length,directions:2,assertions:checks}));
