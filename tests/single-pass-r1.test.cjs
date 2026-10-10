'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const raw = fs.readFileSync('index.html','utf8');
const decode = str => str.replace(/&(?:#x([0-9a-f]+)|#([0-9]+)|lt|gt|amp|quot|apos);/gi,(ent,h,d) =>
  h ? String.fromCodePoint(parseInt(h,16)) : d ? String.fromCodePoint(Number(d)) :
  ({'&lt;':'<','&gt;':'>','&amp;':'&','&quot;':'"','&apos;':"'"})[ent.toLowerCase()] || ent);
const payload = mode => {
  const opener = new RegExp('<textarea id="payload-'+mode+'"[^>]*>');
  const match=raw.match(opener);assert.ok(match,mode+' payload');
  const from=match.index+match[0].length, to=raw.indexOf('</textarea>',from);
  assert.ok(to>from);return decode(raw.slice(from,to));
};
const husband=payload('husband'), wife=payload('wife');
const sources=[['K2L',husband],['L2K',wife]];
const slice=(s,start,end)=>{
  const i=s.indexOf(start),j=s.indexOf(end,i+start.length);
  assert.ok(i>=0 && j>i,'section: '+start+' / '+end);
  return s.slice(i,j);
};
function context(source,start,end,mocks={}){
  const ctx=vm.createContext({console:{warn(){}}, ...mocks});
  vm.runInContext(slice(source,start,end),ctx,{timeout:2000});
  return ctx;
}
function assertOne(str,fragment){
  const n=str.split(fragment).length-1;
  assert.equal(n,1,fragment+' count: '+n);
}


test('embedded SHA-256 fingerprints reflect actual decoded runtime payloads',()=>{
  const crypto=require('node:crypto');
  for(const [name,src] of sources){
    const id=name==='K2L'?'husband':'wife';
    const tag=raw.match(new RegExp('<textarea id="payload-'+id+'"[^>]*>'))[0];
    const expected=tag.match(/data-sha256="([a-f0-9]{64})"/)[1];
    const actual=crypto.createHash('sha256').update(src,'utf8').digest('hex');
    assert.equal(expected,actual,name+'/payload');
  }
});

test('parse all inline JavaScript in wife and husband payloads and integrated shell',()=>{
  for(const [name,src] of [...sources,['shell',raw]]) {
    const jsTags=[...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    assert.ok(jsTags.length>0,name+' scripts');
    let count=0;
    for(const m of jsTags){
      if(/\btype\s*=\s*["'](?:application\/json|text\/plain)["']/i.test(m[1]))continue;
      new vm.Script(m[2],{filename:name+'/script-'+(++count)+'.js'});
    }
    assert.ok(count>0,name+' parsed executable scripts');
  }
});
test('forward routes have one provider generation and no auto repair',()=>{
  for(const [name,src] of sources){
    const f=slice(src,'async function translateText(','function cancelBackTranslation(');
    if(name==='K2L')assertOne(f,"createGeminiRequest(krText,runId,'정번역'");
    else assertOne(f,"createForwardRequest(source,ctx,'ຄຳແປຫຼັກ'");
    assert.doesNotMatch(f,/await requestCriticalMeaningRepair(?:K2L|L2K)\(/);
    assert.match(f,/semanticAdvisory:true/);
    assert.match(f,/OBJECTIVE_OUTPUT_CORRUPTION/);
    assert.match(f,/void requestBackTranslation\(true\)/);
  }
});
test('both directions register detection respects endings, not the noun 필요',()=>{
  for(const [name,src] of sources){
    const ctx=context(src,'function detectKoreanRegisterForBack(text){','function backRegisterMetaLine(');
    assert.equal(vm.runInContext('detectKoreanRegisterForBack("먹을 필요 없어요.")',ctx),'POLITE',name);
    assert.equal(vm.runInContext('detectKoreanRegisterForBack("필요해요.")',ctx),'POLITE',name);
    assert.equal(vm.runInContext('detectKoreanRegisterForBack("사 보세요.")',ctx),'POLITE',name);
    assert.equal(vm.runInContext('detectKoreanRegisterForBack("필요.")',ctx),'CASUAL',name);
    assert.equal(vm.runInContext('detectKoreanRegisterForBack("밥 먹어.")',ctx),'CASUAL',name);
  }
});
test('both directions numeric alias: bare 한번 is not numeral one',()=>{
  for(const [name,src] of sources){
    const ctx=context(src,'function semanticNumberAliasSet(text,lang){','function temporalProfile(');
    const tokens=(txt,lang)=>[...vm.runInContext('semanticNumberAliasSet('+JSON.stringify(txt)+','+JSON.stringify(lang)+')',ctx)];
    assert.deepEqual(tokens('한번 확인해 봐','ko'),[],name);
    assert.deepEqual(tokens('한 번 확인해 봐','ko'),['1'],name);
    assert.deepEqual(tokens('한 잔','ko'),['1'],name);
    assert.deepEqual(tokens('두 번','ko'),['2'],name);
    assert.deepEqual(tokens('ສອງ ຄົນ','lo'),['2'],name);
  }
});
test('K2L independent back: severe output anomaly does not trigger second request',async()=>{
  let count=0, seen=[];
  const ctx=context(husband,'async function runBackTranslationWithLanguageRecovery(laoText,myRunId){','function setBackTime(',{
    createBackTranslationRequest:async text=>{seen.push(text);count++;return{text:'garbled/raw first result'};},
    backSevereAnomalyL2K:()=>({reasons:['NO_KOREAN']})
  });
  const got=await vm.runInContext('runBackTranslationWithLanguageRecovery("ຂ້ອຍໄປ",11)',ctx);
  assert.equal(count,1);assert.deepEqual(seen,['ຂ້ອຍໄປ']);
  assert.equal(got.text,'garbled/raw first result');assert.equal(got.technicalRetryCount,0);
});
test('L2K independent back: severe output anomaly does not trigger second request',async()=>{
  let count=0,seen=[];
  const ctx=context(wife,'async function runBackRaceWithRelationRecovery(korean,runId){','function backErrorMessageLao(',{
    createBackRequest:async text=>{seen.push(text);count++;return{text:'bad/raw first result'};},
    backSevereAnomalyK2L:()=>({reasons:['NO_LAO']})
  });
  const got=await vm.runInContext('runBackRaceWithRelationRecovery("먹을 필요 없어요.",11)',ctx);
  assert.equal(count,1);assert.deepEqual(seen,['먹을 필요 없어요.']);
  assert.equal(got.text,'bad/raw first result');assert.equal(got.technicalRetryCount,0);
});
test('direct Gemini TypeError, 408, 5xx, and auth: no hidden replay in either app',async()=>{
  for(const [name,src] of sources){
    const pred=slice(src,'function isSinglePassGenerationPath(path,meta={})','async function integratedRelayFetchDirect(');
    const direct=slice(src,'async function fetchPrimaryDirect(url,options={},meta={})','async function fetchSecondaryDirect(');
    for(const scenario of ['TypeError',408,500,503,401]){
      let calls=0,relay=0,auth=0,prompt=0;
      const ctx=vm.createContext({
        fetch:async()=>{calls++;if(scenario==='TypeError')throw new TypeError('network');return{ok:false,status:scenario};},
        integratedRelayGeminiFetch:async()=>{relay++;return{ok:true,status:200}},
        integratedPrimaryPasswordError:status=>status===401,
        integratedSafeResponseText:async()=>'',requestIntegratedCredentialRefresh:async()=>{auth++;return true;},
        requestIntegratedCredentialEntry:()=>{prompt++;},
        reportIntegratedCredentialGood:()=>{},
        currentApiKey:'TEST_ONLY',
        console:{warn(){}}
      });
      vm.runInContext(pred+direct,ctx,{timeout:2000});
      const action='translate',url='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
      try{await vm.runInContext('fetchPrimaryDirect('+JSON.stringify(url)+',{method:"POST"},{action:"'+action+'"})',ctx)}
      catch(e){if(scenario!=='TypeError')throw e;}
      assert.equal(calls,1,name+'/'+scenario+'/fetch');
      assert.equal(relay,0,name+'/'+scenario+'/relay');
      assert.equal(auth,scenario===401?1:0,name+'/'+scenario+'/refresh');
      assert.equal(prompt,scenario===401?1:0,name+'/'+scenario+'/entry');
    }
  }
});
test('translation relay route failover stops after first attempted region and path',async()=>{
  for(const [name,src] of sources){
    const pred=slice(src,'function isSinglePassGenerationPath(path,meta={})','async function integratedRelayFetchDirect(');
    const route=slice(src,'async function integratedRelayFetch(path,init={},meta={},preferredName=\'\'){','async function integratedRelayFetchSingleDirect');
    for(const preferred of ['direct','cloudflare']){
      let direct=0,cloudflare=0;
      const mock={
        INTEGRATED_MODE:name==='L2K'?'wife':'husband',
        networkRouteFeature:()=> 'translate',
        networkRoutePreferred:()=>preferred,
        networkRouteRecord:()=>{},
        integratedRelayRouteOrder:()=>[{name:'seoul'},{name:'bangkok'}],
        integratedRelayShouldFailover:()=>true,
        integratedRelayFetchDirect:async()=>{direct++;return{status:503,ok:false,__providerErrorBody:'retryable'};},
        integratedCloudflareFetch:async()=>{cloudflare++;return{status:503,ok:false,__providerErrorBody:'retryable'};}
      };
      const ctx=vm.createContext(mock);
      vm.runInContext(pred+route,ctx);
      await vm.runInContext('integratedRelayFetch("/gemini/generate",{method:"POST"},{action:"translate"})',ctx);
      const expectedRoute=name==='L2K'?'cloudflare':preferred;
      assert.equal(direct,expectedRoute==='direct'?1:0,name+'/'+preferred);
      assert.equal(cloudflare,expectedRoute==='cloudflare'?1:0,name+'/'+preferred);
    }
  }
});
test('single generation guard does not disable unrelated STT route policy',()=>{
  for(const [,src] of sources){
    const ctx=context(src,'function isSinglePassGenerationPath(path,meta={})','async function integratedRelayFetchDirect(');
    assert.equal(vm.runInContext('isSinglePassGenerationPath("/gemini/generate",{action:"translate"})',ctx),true);
    assert.equal(vm.runInContext('isSinglePassGenerationPath("/gemini/generate",{action:"back"})',ctx),true);
    assert.equal(vm.runInContext('isSinglePassGenerationPath("/gemini/audio-transcribe",{action:"stt-ai-recovery"})',ctx),false);
    assert.equal(vm.runInContext('isSinglePassGenerationPath("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",{action:"stt-cleanup"})',ctx),false);
    assert.equal(vm.runInContext('isSinglePassGenerationPath("/azure/tts",{action:"tts"})',ctx),false);
  }
});
