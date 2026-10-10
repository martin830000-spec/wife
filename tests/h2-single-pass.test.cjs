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
  const a=s.indexOf('function pcBackDetail('),b=s.indexOf('function pcSummaryMs(',a);
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
