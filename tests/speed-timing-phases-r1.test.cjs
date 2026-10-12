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
