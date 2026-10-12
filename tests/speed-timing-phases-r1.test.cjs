'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');const {test}=require('node:test');
const raw=fs.readFileSync('index.html','utf8');
const decode=str=>str.replace(/&(?:#x([0-9a-f]+)|#([0-9]+)|lt|gt|amp|quot|apos);/gi,(ent,h,d)=>h?String.fromCodePoint(parseInt(h,16)):d?String.fromCodePoint(Number(d)):({'&lt;':'<','&gt;':'>','&amp;':'&','&quot;':'"','&apos':"'"})[ent.toLowerCase()]||ent);
const payload=mode=>{const m=raw.match(new RegExp('<textarea id="payload-'+mode+'"[^>]*>'));assert.ok(m);const end=raw.indexOf('</textarea>',m.index+m[0].length);assert.ok(end>m.index);return decode(raw.slice(m.index+m[0].length,end))};
const husband=payload('husband'),wife=payload('wife');
for(const [name,src] of [['husband',husband],['wife',wife]]){
 test(name+' forward and back phase instrumentation is present',()=>{assert.match(src,/responseHeadersMs/);assert.match(src,/responseReadyMs/);assert.match(src,/bodyAndJsonMs/);assert.match(src,/postJsonMs/);assert.match(src,/telemetryAttachBackText/);assert.match(src,/backUsage/);assert.match(src,/X-Provider-Ms/);assert.ok(!src.includes("record.providerMs=Number(res?.headers?.get?.('X-Provider-Ms'))"))});
 test(name+' original route and single-pass behavior retained',()=>{assert.match(src,/isSinglePassGenerationPath/);assert.match(src,/fetchPrimaryDirect/);assert.match(src,/thinkingLevel:\s*['"]low['"]/);assert.match(src,/createBack/)});
}
test('no external network calls added by phase labels',()=>{for(const t of ['__speedJsonStart','__speedBackReadyMs','bodyAndJsonMs'])assert.ok(raw.includes(t));assert.ok(!raw.includes('fetchSpeedProbe'))});

const vm=require('node:vm');
for(const [mode,src] of [['husband',husband],['wife',wife]]){
 function setup(){
  const queue=[];
  const ctx=vm.createContext({
   liveTelemetryCurrent:null,liveTelemetryAttempt:null,liveTelemetryLastTraceId:'',
   LIVE_INSTALL_ID:'mock',LIVE_OS_FAMILY:'mock',LIVE_CLIENT_ENV:'mock',LIVE_SESSION_ID:'test',
   INTEGRATED_MODE:mode,APP_VERSION:'test',
   telemetryMakeId:()=> 'mock',telemetryQualitySnapshot:()=>({pass:true}),
   telemetryScheduleFinalize:()=>{},telemetryQueuePush:r=>queue.push(r)
  });
  const start=src.indexOf('function telemetryFiniteOrNull(');
  const end=src.indexOf('function telemetryBusy()',start);
  assert.ok(start>=0&&end>start,'telemetry section');
  vm.runInContext(src.slice(start,end),ctx,{timeout:2000});
  return {ctx,queue};
 }
 const dir=mode==='husband'?'K2L':'L2K';
 test(mode+' forward success and failure preserve missing as null',()=>{
  const {ctx,queue}=setup();
  const record={label:'forward',route:'direct',state:'success',elapsedMs:1300,httpStatus:200,
   providerMs:null,relayRoundTripMs:null,estimatedRelayNetworkMs:null,
   usagePromptTokens:null,usageCandidateTokens:null,usageThoughtTokens:null,usageTotalTokens:null,
   responseReadyMs:1260,bodyAndJsonMs:5,postJsonMs:2,promptChars:3900,maxOutputTokens:1024};
  ctx.telemetryCommitPrimary({runId:1,direction:dir,sourceText:'source',targetText:'target',quality:{pass:true},totalMs:1310,winningRequestMs:1300,requestRecords:[record]});
  const rr=ctx.liveTelemetryCurrent.runtime.requestRecords[0];
  for(const field of ['providerMs','relayRoundTripMs','estimatedRelayNetworkMs','usagePromptTokens','usageCandidateTokens','usageThoughtTokens','usageTotalTokens'])assert.equal(rr[field],null,field);
  assert.equal(rr.responseReadyMs,1260);assert.equal(rr.httpStatus,200);
  ctx.telemetryCommitFailure({runId:2,direction:dir,sourceText:'source',error:new Error('network'),stage:'translate',totalMs:2300,requestRecords:[{route:'direct',state:'error',elapsedMs:2300,httpStatus:null,providerMs:null,usagePromptTokens:null}]});
  const failed=queue.at(-1).runtime.requestRecords[0];
  for(const field of ['httpStatus','providerMs','usagePromptTokens'])assert.equal(failed[field],null,field);
 });
 test(mode+' preserves real zero and numeric-string values',()=>{
  const {ctx}=setup();
  ctx.telemetryCommitPrimary({runId:1,direction:dir,sourceText:'source',targetText:'target',quality:{pass:true},totalMs:100,winningRequestMs:90,requestRecords:[{route:'relay',state:'success',providerMs:0,relayRoundTripMs:'90',usagePromptTokens:0,bodyAndJsonMs:0,httpStatus:'200'}]});
  const rr=ctx.liveTelemetryCurrent.runtime.requestRecords[0];
  assert.equal(rr.providerMs,0);assert.equal(rr.relayRoundTripMs,90);assert.equal(rr.usagePromptTokens,0);assert.equal(rr.bodyAndJsonMs,0);assert.equal(rr.httpStatus,200);
 });
 test(mode+' independent back usage remains unknown or known correctly',()=>{
  const {ctx}=setup();
  ctx.telemetryCommitPrimary({runId:1,direction:dir,sourceText:'source',targetText:'target',quality:{pass:true},totalMs:100,winningRequestMs:90,requestRecords:[]});
  ctx.telemetryAttachBackText('target','back',{prompt:null,candidate:null,thoughts:null,total:null,known:false,clientTotalMs:null,responseReadyMs:null,bodyAndJsonMs:null,route:'direct'});
  const u=ctx.liveTelemetryCurrent.runtime.backUsage;
  assert.equal(u.known,false);for(const field of ['prompt','candidate','thoughts','total','totalMs','responseReadyMs','bodyAndJsonMs'])assert.equal(u[field],null,field);
  ctx.telemetryAttachBackText('target','back',{prompt:0,candidate:0,thoughts:0,total:0,known:true,clientTotalMs:20,responseReadyMs:15,bodyAndJsonMs:2,route:'direct'});
  const known=ctx.liveTelemetryCurrent.runtime.backUsage;
  assert.equal(known.known,true);assert.equal(known.prompt,0);assert.equal(known.totalMs,20);assert.equal(known.responseReadyMs,15);
 });
}
