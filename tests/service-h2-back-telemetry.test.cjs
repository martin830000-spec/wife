'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const html=fs.readFileSync('diagnostic-h2-20261010.html','utf8');
const integrity=JSON.parse(fs.readFileSync('diagnostic-integrity.json','utf8'));
const shell=fs.readFileSync('index.html','utf8');
const ver=JSON.parse(fs.readFileSync('version.json','utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
test('SERVICE source, H2 and SHA integrity, preserved operational version',()=>{
 assert.equal(integrity.sha256,sha(html));
 assert.equal(ver.version,'V3.61.209'); assert.match(ver.build,/SERVICE-R2-VOICE-SINGLEPASS-H2-R1/);
 assert.match(shell,/const INTEGRATED_CHANNEL='SERVICE'/);
 assert.match(shell,/추억사진첩|MEMORY_ALBUM/);
 for(const s of shell.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/application\/json/.test(s[1]))new vm.Script(s[2]);
 for(const s of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/application\/json/.test(s[1]))new vm.Script(s[2]);
});
const functions=html.slice(html.indexOf('// H2 BACK telemetry: display-only'),html.indexOf('function retrySessionCompact('));
test('backUsage missing/null/empty is unmeasured; good finite values preserved',()=>{
 const ctx=vm.createContext({Set});vm.runInContext(functions,ctx);
 const run=s=>vm.runInContext(s,ctx);
 assert.equal(run('backTelemetryMs({runtime:{backUsage:{totalMs:null}}})'),null);
 assert.equal(run('backTelemetryMs({runtime:{backUsage:{}}})'),null);
 assert.equal(run("backTelemetryMs({runtime:{backUsage:{totalMs:''}}})"),null);
 assert.equal(run('backTelemetryMs({runtime:{backUsage:{totalMs:-1}}})'),null);
 assert.equal(run('backTelemetryMs({runtime:{backUsage:{totalMs:2345}}})'),2345);
 assert.equal(run('backTelemetryStatus({runtime:{backUsage:{}}})'),'미측정');
 assert.match(run('backTelemetryExport({runtime:{backUsage:{}}})'),/미측정/);
});
test('known synthetic identifiers excluded; normal traces unaffected',()=>{
 const ctx=vm.createContext({Set});vm.runInContext(functions,ctx);
 assert.equal(vm.runInContext("isKnownSyntheticBackTelemetryRecord({eventId:'diag-backtime-20261016-asia-northeast3-a07616ec3811'})",ctx),true);
 assert.equal(vm.runInContext("isKnownSyntheticBackTelemetryRecord({eventId:'diag-backtime-20261016-asia-southeast3-0e7ade50062f'})",ctx),true);
 assert.equal(vm.runInContext("isKnownSyntheticBackTelemetryRecord({eventId:'real-app-user-request'})",ctx),false);
});
test('H2 exports back times and excludes synthetic only in real-use performance',()=>{
 assert.match(html,/역번역 측정: \$\{backTelemetryExport\(r\)\}/);
 assert.match(html,/syntheticExcluded=\$\{syntheticExcluded\}/);
 assert.match(html,/backs=rows\.filter\(r=>backTelemetryMs\(r\)!==null\)/);
});