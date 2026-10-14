# 2026-10-14 TEXT DIRECT / NETWORK UI / VOICE ROUTE R2 — TEST STAGING AUDIT

Status: **TEST CANDIDATE CODE COMMITTED; STATIC/MOCK CI PASS; NOT PAGES DEPLOYED; NOT SERVICE PROMOTED.**
This is an **additive evidence record**, not a replacement for `EVIDENCE/20261014_TEXT_DIRECT_FULL_TEST_AUDIT_R2.md`.

## Baseline and protected scope
- Previous TEST audit: 33 wife + 5 general + 7 Pages checks = 45 PASS (baseline before this R2).
- Direct Gemini API, LOW, forward exactly one and independent back exactly one per requested translation, unchanged. No hidden translation recovery, no translation server failover.
- Frozen SERVICE couple V3.61.209 / P168A R8 / G158A; general SERVICE V3.61.207. No writes to SERVICE main, Cloud Run/Cloudflare, telemetry/history DB, H2 or operational data. No paid Gemini calls.
- Branch across three TEST repos: `test/text-direct-voice-route-ui-r2-20261014`.

## Applied R2 changes
1. Husband and wife embedded app route UI: hide legacy auto/direct/Cloudflare preference buttons without deleting storage keys, functions, or DOM IDs. Display truthful direct Gemini text-forward/back and speech route information in Korean/Lao.
2. Wife integrated normal voice runtime WebSocket `voiceWsCandidates()`: only Cloudflare candidates; remove direct Cloud Run attempted after Cloudflare failure. Husband retains direct-first and CF fallback.
3. Wife normal voice REST/AI fallback `integratedRelayFetchSingle()`: restrict STT/TTS to Cloudflare; other feature paths retain existing logic. Existing `integratedRelayFetch()` wife fallback guard remains.
4. General `relayRoutes()`: user custom Relay URL no longer overrides STT/TTS, including `/health` capability probing; wife voice returns Cloudflare, husband voice retains Cloud Run direct first. Custom Relay remains available for nonvoice legacy relay operations.
5. General UI network selector hidden, localized explanatory text presented. **Retained** `aiTranscribe()` and `directAudioTranscribe()` for languages not supported by native relay and native-STT failure fallback: deleting this without confirmed server `/gemini/audio-transcribe` support can remove existing languages. Those calls are speech recognition, NOT translation back/forward generation.

## Candidate code integrity
- `wife/test/text-direct-voice-route-ui-r2-20261014`: embedded husband decoded SHA256 `35a5d0a6110bba62988c1b26b1f800ebe93cb51af070fee3f4063293a1ad20b0`; wife `3a75245234dde87df9e8fec45dd51adbf18f0138115097bf1152ca8f6778b076`.
- `laos-translator/test/text-direct-voice-route-ui-r2-20261014`: matching two exact embedded SHAs. Current Pages `main` remains prior R1 build.
- `korean-lao-general-test/test/text-direct-voice-route-ui-r2-20261014`: general embedded SHA256 `04e86b4989bb9471bbb0464eae6a2849c55c8d0404ce0c31eca4ca02a86ac09c`. Outer/inner build IDs both `20261014-V3.61.202-TEST-VOICE-UI-R2`.
- Husband/wife build ID `20261014-V3.61.209-TEST-VOICE-UI-R2` in candidate `version.json`. Version numbers unchanged. Prompt-config Git blob couple `b1323967ef529e0c960d6e7ab707ea43659b8b6a`, general `a75b9c221732e98afa54550123fe027677521fa9` (unchanged).
- Syntax of all embedded executable scripts and outer shell scripts parsed on candidate before write and embedded hashes recalculated/read back.

## GitHub Actions R2 results — new candidate, no paid APIs
| Repository | Run | Checks | Outcome |
|---|---|---:|---|
| `wife` | https://github.com/martin830000-spec/wife/actions/runs/38554260116 | 37 (33 existing + 4 R2) | 37 PASS, 0 FAIL |
| `laos-translator` candidate | https://github.com/martin830000-spec/laos-translator/actions/runs/38554266382 | 4 R2 | 4 PASS, 0 FAIL |
| `korean-lao-general-test` candidate | https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38554272063 | 5 R2 | 5 PASS, 0 FAIL |

Total: 46 test invocations PASS, 0 FAIL (wife and Pages suites include intentionally repeated parity checks).

## Missing evidence / release gate
- Actual Laos ISP real-device Cloudflare/WebSocket/REST/TTS behavior: NOT tested for this R2; mocked static checks are not connectivity proof.
- Live backend `/gemini/audio-transcribe` route availability, supported languages and output parity: UNVERIFIED. Previously located old Cloud Run source was for *memory-album* and cannot prove STT route support.
- Regression effect on real audio latency and fallback success: UNVERIFIED.
- General TEST V3.61.202 must be **merged against SERVICE V3.61.207** for any future promotion; never overwrite the V207 later changes.
- Deployment (Pages main) and SERVICE promotion require separate release decision after evidence review. Maintain original R1 Pages live until then.
