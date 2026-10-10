'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {test}=require('node:test'),crypto=require('node:crypto');
const s=fs.readFileSync('diagnostic-h2-20261010.html','utf8');
const manifest=JSON.parse(fs.readFileSync('diagnostic-integrity.json','utf8'));
test('H2 HTML scripts parse and SHA manifest stays verified',()=>{
  const scripts=[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length>0);
  for(const [i,m]of scripts.entries())if(!/\btype\s*=\s*["'](?:application\/json|text\/plain)["']/i.test(m[1]))new vm.Script(m[2],{filename:'h2-'+i+'.js'});
  assert.equal(crypto.createHash('sha256').update(s,'utf8').digest('hex'),manifest.sha256);
});
test('H2 status counts actual outer forward generations/fetches: PASS FAIL UNKNOWN',()=>{
  const a=s.indexOf('function pcValidMs('),b=s.indexOf('function pcSummaryMs(',a);
  assert.ok(a>=0&&b>a);
  const ctx=vm.createContext({});
  vm.runInContext(s.slice(a,b),ctx);
  const check=(generations,network,expected)=>{
    const requestTrace=Array.from({length:generations},(_,i)=>({kind:'forward',label:'fwd-'+i}));
    const networkTrace=Array.from({length:network},(_,i)=>({action:'translate',status:200,route:'cloudflare'}));
    const got=vm.runInContext('pcForwardDetail('+JSON.stringify({ok:true,displayMs:120,requestTrace,networkTrace})+')',ctx);
    assert.equal(got.singlePassForwardStatus,expected);
    assert.equal(got.clientForwardGenerations,generations);
    assert.equal(got.clientForwardFetches,network);
  };
  check(1,1,'PASS');check(2,2,'FAIL');check(1,2,'FAIL');check(0,0,'UNKNOWN');check(1,0,'UNKNOWN');
});
test('H2 A/B log shows both direction counts and marks unknown separately',()=>{
  assert.match(s,/singlePassForwardStatus/);
  assert.match(s,/SINGLE_PASS_FORWARD_FAILURES_A/);
  assert.match(s,/SINGLE_PASS_FORWARD_FAILURES_B/);
  assert.match(s,/K2L_COUNT/);
  assert.match(s,/L2K_COUNT/);
  assert.match(s,/Backend\/provider retries not observed/);
});

test('H2 backtranslation trace enforces independent single generation and transport',()=>{
  const a=s.indexOf('function pcValidMs('),b=s.indexOf('function pcSummaryMs(',a);
  assert.ok(a>=0&&b>a);
  const ctx=vm.createContext({});
  vm.runInContext(s.slice(a,b),ctx);
  const check=(gens,fetches,status)=>{
    const x={records:Array.from({length:gens},()=>({label:'back'})),networkTrace:Array.from({length:fetches},()=>({route:'relay'}))};
    const d=vm.runInContext('pcBackDetail('+JSON.stringify(x)+')',ctx);
    assert.equal(d.singlePassBackStatus,status);
    assert.equal(d.clientBackGenerations,gens);
    assert.equal(d.clientBackFetches,fetches);
  };
  check(1,1,'PASS');check(2,1,'FAIL');check(1,2,'FAIL');check(0,0,'UNKNOWN');
  assert.equal(vm.runInContext('pcBackDetail({ok:true})',ctx).singlePassBackStatus,'UNKNOWN');
  assert.match(s,/SINGLE_PASS_BACK_FAILURES_A/);
  assert.match(s,/SINGLE_PASS_BACK_FAILURES_B/);
  assert.match(s,/A_BACK_DETAIL_JSON/);
  assert.match(s,/B_BACK_DETAIL_JSON/);
});

test('H2 A/B audit validates retained isolation and single-pass fields, not removed prose',()=>{
  const from=s.indexOf('function makePromptCompareLog()'),to=s.indexOf('async function runPromptCompare()',from);
  assert.ok(from>=0&&to>from,'A/B log function boundaries');
  const log=s.slice(from,to);
  assert.ok(log.includes("'AUTO_QUALITY_EVALUATION=false'"),'actual A/B logging marker');
  const checkAt=s.indexOf("add('prompt compare isolated no auto evaluation'"),checkEnd=s.indexOf(");add('quality phase watchdog'",checkAt);
  assert.ok(checkAt>=0&&checkEnd>checkAt);
  const check=s.slice(checkAt,checkEnd);
  assert.ok(check.includes("makePromptCompareLog.toString().includes('AUTO_QUALITY_EVALUATION=false')"),'selfcheck matches A/B log key');
  assert.ok(!check.includes("makePromptCompareLog.toString().includes('AUTO_EVALUATION=false')"),'no obsolete key');
  assert.match(s,/prompt compare isolated no auto evaluation/);
  assert.match(s,/promptCompareInjectSrcdoc\.toString\(\)\.includes/);
  assert.match(s,/SINGLE_PASS_METRIC=client forward AND back generations/);
  assert.doesNotMatch(s,/makePromptCompareLog\.toString\(\)\.includes\('roundtrip meaning preservation'\)/);
});

test('H2 compares real historical P160A clone against P160-derived candidate',()=>{
  const findConfig=name=>{
    const m=s.match(new RegExp('const '+name+'=(\\{[^\\n]+\\});'));
    assert.ok(m,'embedded '+name);
    return JSON.parse(m[1]);
  };
  const a=findConfig('PROMPT_COMPARE_P160A_CONFIG'),b=findConfig('PROMPT_COMPARE_DEFAULT_B');
  const canonical=x=>JSON.stringify({schemaVersion:x.schemaVersion,channel:x.channel,promptRevision:x.promptRevision,forward:x.forward,smart:x.smart,back:x.back});
  assert.equal(a.promptRevision,'P160A');
  assert.equal(a.promptSha256,'422e1d8fa4b51c790d385a2d314da1e99de31681198a0e69183d57a9be2fe639');
  assert.equal(b.promptRevision,'EXP-P160-SEMANTIC-FIDELITY-R2');
  assert.equal(b.promptSha256,'2879e76ce584a018dfcd2b479911e4931772bc52ac581647dae0d891fdc63910');
  for(const p of [a,b])assert.equal(crypto.createHash('sha256').update(canonical(p)).digest('hex'),p.promptSha256);
  assert.deepEqual(a.smart,b.smart);
  assert.deepEqual(a.back,b.back);
  assert.notEqual(a.forward.k2l,b.forward.k2l);
  assert.notEqual(a.forward.l2k,b.forward.l2k);
  assert.match(s,/BASELINE_NOT_EXACT_P160A/);
  assert.match(s,/SERVICE_RUNTIME_FINGERPRINT_MISMATCH/);
  assert.match(s,/PROMPT_COMPARE_SERVICE_REV='P168A'/);
  assert.match(s,/promptCompareLoadBase\(\);/);
  const start=s.indexOf('async function promptCompareLane('),stop=s.indexOf('function makePromptCompareLog()',start);
  assert.ok(start>0&&stop>start);
  const lane=s.slice(start,stop);
  assert.match(lane,/promptCompareCandidateForward\(dir,source,kind==='A'\?cfg.base:cfg.candidate\)/);
  assert.match(lane,/promptCompareCandidateBack\(dir,out.forward,kind==='A'\?cfg.base:cfg.candidate\)/);
  assert.doesNotMatch(lane,/localCoupleForward\(/);
  assert.doesNotMatch(lane,/localCoupleBack\(/);
  assert.match(s,/const z=await promptCompareLane\(lane,dir,source,prep\)/);
});

test('H2 persists independent back details in both lanes with token usage or UNKNOWN',()=>{
 assert.ok(s.includes('row.aBackDetail=z.backDetail'));
 assert.ok(s.includes('row.bBackDetail=z.backDetail'));
 assert.ok(s.includes('aBackDetail:null,bBackDetail:null'));
 assert.ok(s.includes('H2-BACK-TOKENS-R2'));
 assert.ok(s.includes('tokenUsageSource'));
 assert.ok(s.includes('BACK_DETAIL_JSON'));
 assert.ok(s.includes("promptCompareCandidateBack(dir,out.forward,kind==='A'?cfg.base:cfg.candidate)"));
});

test('H2 real usage of back diagnostics is transported in cloned instrumentation for husband and wife',()=>{
  const start=s.indexOf('function enrichBackTokenDiagnosticClone('),end=s.indexOf('function promptCompareInjectSrcdoc(',start);
  assert.ok(start>0&&end>start);
  const ctx=vm.createContext({});
  vm.runInContext(s.slice(start,end),ctx);
  const fixture='function run(v){const rec={};rec.quality=v?.quality||null;return v}';
  for(const mode of ['husband','wife']){
    const patched=ctx.enrichBackTokenDiagnosticClone(fixture,mode);
    assert.notEqual(patched,fixture);
    assert.ok(patched.includes('rec.usageMetadata='));
    const testSrc=patched.replace('return v}', 'return rec}')+
      ';run({usage:{prompt:250,candidate:13,thoughts:24,total:287}})';
    const record=vm.runInContext(testSrc,vm.createContext({}));
    assert.equal(record.usageMetadata.promptTokenCount,250);
    assert.equal(record.usageMetadata.candidatesTokenCount,13);
    assert.equal(record.usageMetadata.thoughtsTokenCount,24);
    assert.equal(record.usageMetadata.totalTokenCount,287);
    const missing=vm.runInContext(patched.replace('return v}', 'return rec}')+';run({})',vm.createContext({}));
    assert.equal(missing.usageMetadata,null);
  }
  assert.match(s,/promptCompareInjectSrcdoc\(enrichBackTokenDiagnosticClone\(enrichRepairDiagnosticClone\(doc\.srcdoc,mode\),mode\),cfg\)/);
  assert.match(s,/const backUsage=v\?\.usage/);
});
test('H2 estimates four-path cost ONLY when both reverse and forward token totals are observed',()=>{
  const a=s.indexOf('function pcValidMs('),b=s.indexOf('function pcForwardDetail(',a);
  const x=s.indexOf('function pcCostRate('),y=s.indexOf('function pcSummarizeForward(',x);
  assert.ok(a>0&&b>a&&x>0&&y>x);
  const ctx=vm.createContext({MODEL:'gemini-3.8-flash'});
  vm.runInContext(s.slice(a,b)+s.slice(x,y),ctx);
  const forward={requestTrace:[{promptTokens:100,totalTokens:150}]};
  const back={requestTrace:[{promptTokens:200,totalTokens:225}]};
  const row={dir:'K2L',aForwardDetail:forward,aBackDetail:back};
  ctx.rows=[row];const complete=vm.runInContext("pcFourPathCost(rows,'K2L','A')",ctx);
  assert.equal(complete.complete,true);assert.equal(complete.forwardKnown,1);
  assert.equal(complete.backKnown,1);assert.equal(complete.backPromptTokens,200);
  assert.ok(complete.totalUsd>0);
  const forwardUsd=(100*.75+50*3.75)/1e6,backUsd=(200*.75+25*3.75)/1e6;
  assert.ok(Math.abs(complete.totalUsd-forwardUsd-backUsd)<1e-10);
  ctx.rows=[{dir:'L2K',aForwardDetail:forward,aBackDetail:{requestTrace:[{promptTokens:null,totalTokens:null}]}}];
  const missing=vm.runInContext("pcFourPathCost(rows,'L2K','A')",ctx);
  assert.equal(missing.complete,false);assert.equal(missing.totalUsd,null);
  assert.equal(missing.backUsd,null);assert.equal(missing.backKnown,0);
  assert.match(s,/FOUR_PATH_COST_ESTIMATE_JSON/);
  assert.match(s,/id="pcCostA"/);
  assert.match(s,/id="pcCostB"/);
});

test('H2 has budget-safe balanced 4-case instrumentation smoke option',()=>{
 assert.match(s,/<select id="promptCompareCount"><option value="4" selected>/);
 assert.match(s,/4건 · 비용 기록 확인용/);
 assert.match(s,/Math\.ceil\(n\/2\)/);
 assert.match(s,/Math\.floor\(n\/2\)/);
});

// TEST H2 NEW SAMPLE R5: deterministic, no live API calls and no SERVICE code involvement.
test('H2 new-only sampler removes historic 50, excludes seen values, and removes near-duplicates',()=>{
  const a=s.indexOf('const PC_HISTORIC_50_HASHES='),b=s.indexOf('function promptCompareUpdate(',a);
  assert.ok(a>0&&b>a,'sampler functions exist');
  const ctx=vm.createContext({pcRisk:()=>''});
  vm.runInContext(s.slice(a,b),ctx);
  assert.equal(vm.runInContext('PC_HISTORIC_50_HASHES.size',ctx),50);
  const exact='오늘 집에 가는 길에 꽃집에 가서 한번 사 보세요.';
  assert.equal(vm.runInContext('pcSourceHash('+JSON.stringify(exact)+')',ctx),'5af6cf62391f5ed8');
  const aText='오늘은 영화를 보기 전에 친구에게 생일 선물을 전해 줄게.';
  const near='오늘은 영화를 보기 전에 친구에게 생일 선물을 전해 줄게! 😀';
  const clean='내일은 공원에서 아내와 함께 산책을 하고 저녁을 먹을 거야.';
  const stats={};
  ctx.records=[{sourceText:exact},{sourceText:aText},{sourceText:near},{sourceText:clean}];
  ctx.extra={mode:'NEW',seed:'testseed',previous:new Set(),stats};
  const result=vm.runInContext("promptCompareUnique(records,5,'K2L',extra)",ctx);
  assert.equal(result.length,2,'one historic and one near duplicate excluded');
  assert.equal(stats.excludedHistorical,1);
  assert.equal(stats.excludedNear,1);
  ctx.extra.previous.add(vm.runInContext('pcSourceHash('+JSON.stringify(clean)+')',ctx));
  const again=vm.runInContext("promptCompareUnique(records,5,'K2L',extra)",ctx);
  assert.equal(again.length,1);
});
test('H2 never silently substitutes old records for insufficient new holdout',async()=>{
  const a=s.indexOf('const PC_HISTORIC_50_HASHES='),b=s.indexOf('function promptCompareUpdate(',a);
  const context=vm.createContext({pcRisk:()=>'',fetchRecentRecords:async(dir)=>dir==='K2L'?
    [{sourceText:'오늘 집에 가는 길에 꽃집에 가서 한번 사 보세요.',direction:dir},{sourceText:'안녕하세요 새로운 한국어 문장입니다. 내일 다시 전화해 주세요.',direction:dir}]:
    [{sourceText:'ວັນນີ້ກິນເຂົ້າຢູ່ກັບຄອບຄົວ',direction:dir},{sourceText:'ຕອນຄ່ຳຈະໄປຊື້ດອກໄມ້ກັບໝູ່',direction:dir}]});
  vm.runInContext(s.slice(a,b),context);
  vm.runInContext('pcHistoryRead=async()=>new Set()',context);
  await assert.rejects(vm.runInContext("promptCompareFetchRows(4,'NEW','fixture')",context),/INSUFFICIENT_NEW_CASES/);
  const reg=await vm.runInContext("promptCompareFetchRows(4,'REGRESSION','fixture')",context);
  assert.equal(reg.length,4);
  assert.equal(reg.sampleMeta.mode,'REGRESSION');
});
test('H2 retains independent four-path review warnings and evidence in TXT without self-grading',()=>{
  const a=s.indexOf('const PC_REVIEW_STAGES='),b=s.indexOf('function promptCompareRender(',a);
  assert.ok(a>0&&b>a);
  const ctx=vm.createContext({});
  vm.runInContext(s.slice(a,b),ctx);
  const flags=vm.runInContext("pcStageFlags('L2K','안녕하세요','ສະບາຍດີ แถม Wait, correction: test/test')",ctx);
  assert.ok(flags.back.includes('THAI_SCRIPT_SUSPECT'));
  assert.ok(flags.back.includes('FOREIGN_LATIN_SUSPECT'));
  assert.ok(flags.back.includes('SLASH_ALTERNATIVES_SUSPECT'));
  assert.equal(flags.semantic,'MANUAL_REVIEW_REQUIRED');
  const korean=vm.runInContext("pcStageFlags('K2L','ສະບາຍດີ','아멘/사투 사투.')",ctx);
  assert.ok(korean.back.includes('SLASH_ALTERNATIVES_SUSPECT'),'Korean real-run example detected');
  const lao=vm.runInContext("pcStageFlags('L2K','안녕하세요','ອາວ/ລຸງ')",ctx);
  assert.ok(lao.back.includes('SLASH_ALTERNATIVES_SUSPECT'),'Lao family slash detected');
  const url=vm.runInContext("pcStageFlags('K2L','ເບິ່ງ https://example.com/path','한 가지 표현뿐이에요')",ctx);
  assert.equal(url.forward.includes('SLASH_ALTERNATIVES_SUSPECT'),false,'URLs not misidentified');
  assert.match(s,/A_STAGE_REVIEW/);assert.match(s,/B_STAGE_REVIEW/);
  assert.match(s,/SAMPLE_SELECTION_JSON/);assert.match(s,/SAMPLE_MODE=/);
  assert.match(s,/pcStageReviewUi\(r,'A'\)/);
  assert.match(s,/pcStageReviewUi\(r,'B'\)/);
  assert.match(s,/PC_TESTED_HASH_DB_KEY/);
  assert.match(s,/pcHistoryMark\(source\)/);
  assert.doesNotMatch(s,/\b(?:autoQualityResult|autoSemanticGrade)\s*=\s*true/);
});

test('H2 controlled R7 comparison baseline permits exactly one changed wife path',async()=>{
  const a=s.indexOf('async function promptCompareCandidateConfig()'),b=s.indexOf('async function pcCopyBToBase()',a);
  assert.ok(a>0&&b>a);
  const original=JSON.parse(s.match(/const PROMPT_COMPARE_P160A_CONFIG=(\{[^\n]+\});/)[1]);
  const deep=x=>JSON.parse(JSON.stringify(x)),serviceSha='7d28766e1f9938a531fed5870585cb4a3afe735e2c41cc25b511ff7f677ddd43';
  const r7=deep(original);r7.promptRevision='EXP-P160-FOUR-PATH-MEANING-LOCK-R7';r7.promptSha256='443feede17abaf4e06e4b631e98bfbee52eba56c2b9e86df0d8f91283c938310';
  const candidate=deep(r7);candidate.promptRevision='EXP-R7-CONTROLLED-WIFE-FORWARD-FACTS-F1';candidate.forward.l2k+=' \nFaithful added rule.';
  const cells={promptCompareBaseMode:{value:'R7'},pcR7BaseInput:{value:JSON.stringify(r7)},promptCompareCandidate:{value:JSON.stringify(candidate)},promptCompareScope:{value:'ALL'}};
  const ctx=vm.createContext({
    $:k=>cells[k],
    promptCompareLiveConfig:()=>({promptRevision:'P168A',promptSha256:serviceSha}),
    PROMPT_COMPARE_P160A_CONFIG:original,PROMPT_COMPARE_SERVICE_REV:'P168A',PROMPT_COMPARE_SERVICE_SHA:serviceSha,
    PROMPT_COMPARE_BASE_REV:'P160A',PROMPT_COMPARE_BASE_SHA:original.promptSha256,
    promptCompareDeep:deep,
    promptCompareRequired:d=>{if(!d.forward?.k2l||!d.back?.wife)throw Error('invalid config')},
    promptCompareCanonical:d=>JSON.stringify({schemaVersion:d.schemaVersion,channel:d.channel,promptRevision:d.promptRevision,forward:d.forward,smart:d.smart,back:d.back}),
    promptCompareHash:async v=>{const rev=JSON.parse(v).promptRevision;return rev==='P160A'?original.promptSha256:rev==='EXP-P160-FOUR-PATH-MEANING-LOCK-R7'?r7.promptSha256:'CUSTOM_SHA'},
    pcChanged:(a,b)=>{const changes=[];for(const g of ['forward','smart','back'])for(const k of Object.keys(a[g]))if(a[g][k]!==b[g][k])changes.push(g+'.'+k);return changes}
  });
  vm.runInContext(s.slice(a,b),ctx);
  let result=await vm.runInContext('promptCompareCandidateConfig()',ctx);
  assert.equal(result.base.promptRevision,r7.promptRevision);
  assert.equal(result.candidate.promptRevision,candidate.promptRevision);
  assert.equal(JSON.stringify(result.changed),JSON.stringify(['forward.l2k']));
  assert.equal(result.baseMode,'R7');
  candidate.back.wife+=' another change';cells.promptCompareCandidate.value=JSON.stringify(candidate);
  await assert.rejects(vm.runInContext('promptCompareCandidateConfig()',ctx),/R7_CONTROLLED_EXACTLY_ONE/);
  candidate.back.wife=r7.back.wife;candidate.forward.l2k=r7.forward.l2k;candidate.back.wife+=' single back change';
  cells.promptCompareCandidate.value=JSON.stringify(candidate);
  result=await vm.runInContext('promptCompareCandidateConfig()',ctx);
  assert.equal(JSON.stringify(result.changed),JSON.stringify(['back.wife']));
  cells.promptCompareScope.value='BACK';
  await assert.rejects(vm.runInContext('promptCompareCandidateConfig()',ctx),/R7_CONTROLLED_EXACTLY_ONE/);
});
test('H2 four-case pinned cohort accepts only balanced saved records and bypasses DB search',async()=>{
  assert.match(s,/const PC_PINNED_COHORT_DB_KEY=/);
  assert.match(s,/PINNED_LAST_FOUR_NOT_FOUND/);
  assert.match(s,/PINNED_FOUR_PATH_BALANCE_INVALID/);
  const a=s.indexOf('const PC_HISTORIC_50_HASHES='),b=s.indexOf('function promptCompareUpdate(',a);
  assert.ok(a>0&&b>a);
  let dbSearchCalls=0;
  const ctx=vm.createContext({pcRisk:()=>'',fetchRecentRecords:()=>{dbSearchCalls++;throw Error('must not fetch real DB')}});
  vm.runInContext(s.slice(a,b),ctx);
  ctx.pcPinnedReadOrFreeze=async n=>{
    assert.equal(n,4);
    const rows=[{direction:'K2L',sourceText:'one',traceId:'a'},{direction:'L2K',sourceText:'two',traceId:'b'},
      {direction:'K2L',sourceText:'three',traceId:'c'},{direction:'L2K',sourceText:'four',traceId:'d'}];
    rows.sampleMeta={mode:'PINNED',frozen:true};return rows;
  };
  const rows=await vm.runInContext("promptCompareFetchRows(4,'PINNED','fixture')",ctx);
  assert.equal(rows.length,4);assert.equal(rows.sampleMeta.mode,'PINNED');assert.equal(dbSearchCalls,0);
  assert.match(s,/id="promptCompareBaseMode"/);
  assert.match(s,/id="pcR7BaseInput"/);
  assert.match(s,/id="pcCopyBToBase"/);
  assert.match(s,/CONTROLLED_BASE_MODE=/);
});
