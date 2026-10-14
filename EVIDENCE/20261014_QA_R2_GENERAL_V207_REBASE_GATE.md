# 2026-10-14 TEST QA R2 · General V207 Service Rebase Gate

**Status: staged code and offline verification only. No TEST/main re-deployment or SERVICE promotion.**

## User requirements
Text forward and independent back translation in husband, wife and general apps: direct Gemini API, single request per stage, LOW, no automatic Cloudflare/Cloud Run translation replay. Audio STT/TTS: husband Cloud Run primary, wife Cloudflare primary. Preserve current working users, prompts, DB, servers.

## Code provenance and pinned bases
- Pages TEST couple: `martin830000-spec/laos-translator/main` index Git blob `2316d35f2172183580e95df94b2b2f5bcc6b54ae`.
- General TEST: `martin830000-spec/korean-lao-general-test/main` index blob `4cc185a1481c1b8ec85b0a8c12cdfe214ff9888c` (V3.61.202, G158A).
- General SERVICE: `martin830000-spec/korean-lao-general/main` index blob `8d13a8969524ecb1b4f39f2621a981ababa63a83` (V3.61.207, G158A).
- Service couple: `martin830000-spec/wife/main` kept intact (V3.61.209/P168A R8/G158A).

## V202 TEST vs V207 SERVICE direct line-by-line comparison
Decoded embedded general payloads both 1152 lines. LCS comparison identified 11 changed blocks, primarily:
1. HTML version/title labels (202 TEST vs 207 SERVICE).
2. Embedded `APP_VERSION`, `BUILD_ID`, `APP_DEPLOYMENT_CHANNEL` and corresponding shell build.
3. Comment/version strings, release notes, manual version.
4. TEST general sibling navigation -> `laos-translator`; SERVICE general sibling navigation -> `wife`. **Do not overwrite SERVICE with TEST HTML**, or links would be redirected incorrectly.
5. Expected new TEST direct-text `geminiRequest` and STT `networkFeature` / `networkPreferred` changes. SERVICE is still old direct+relay fallback.
All other decoded embedded general source lines were equal; service and TEST general `prompt-config.json` Git blob SHA were equal `a75b9c221732e98afa54550123fe027677521fa9`. Thus no evidence of a different general translation prompt between V202 TEST and V207 SERVICE, but promotion must preserve version/nav/UI.

## QA R2 fix staged (public main unchanged)
- `martin830000-spec/laos-translator/test/qa-ui-route-20261014-r2`
- `martin830000-spec/wife/test/qa-ui-route-20261014-r2`
- `martin830000-spec/korean-lao-general-test/test/qa-ui-route-20261014-r2`
- Replaced wrong adaptive translation/speech reroute user-facing messages with honest *text direct Gemini; voice mode-specific relay* summary. Hid obsolete route selectors at view level without deleting stored preferences, telemetry, or other code. No audio or translation runtime behavior change. Encoded embedded HTML, recomputed SHA256, verified JavaScript parse and checksums.

## Automated test proofs (no paid requests)
- Wife code: https://github.com/martin830000-spec/wife/actions/runs/38546951995 — 33 passed / 0 failed.
- Pages TEST index + H2 manifest SHA: https://github.com/martin830000-spec/laos-translator/actions/runs/38546921911 — 8 passed / 0 failed.
- General TEST: https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38546940888 — 6 passed / 0 failed.
- TOTAL 47 passing offline assertions. No real-traffic fault injection.

## Open STT policy gates; **NOT fixed as part of UI-only QA R2**
- General app `aiTranscribe` uses `directAudioTranscribe` first for STT languages not present in `generalRelayNativeStt`, and as fallback after `relayAiTranscribe` errors for native languages. Strict all-STT-via-relay is NOT currently guaranteed.
- `maybeCorrectVoiceTranscript` may also call Gemini directly as voice-transcript cleanup; this is not normal translation, and altering it may change STT meaning/latency.
- General `relayRoutes` inserts configured custom relay `state.relayUrl` first, potentially bypassing intended default Cloud Run/Cloudflare path.
- Couple wife WebSocket `voiceWsCandidates` includes direct Cloud Run fallback after Cloudflare; unreachable Laos endpoint may increase outage latency.
- Do not disable these exceptions without a backend language coverage matrix and Laos iPhone / Android STT, TTS and all general interpreter languages acceptance tests. There is no paid or real-failure validation for them yet.

## Next safe release path
1. Review/approve UI-only QA R2 deployment to TEST. Original R1 TEST already works; this is a UX-only fix, not reason to re-run expensive translations.
2. Test core speech and international language coverage separately before rerouting all STT.
3. For future SERVICE general promotion, base a new candidate from the **V3.61.207 SERVICE** `main`, apply only `geminiRequest` direct-only, `networkFeature` audio-STT classification, `networkPreferred` speech-mode routing and validated QA UI; retain SERVICE sibling `wife` URLs, release notes/versions, storage and G158A.
4. No SERVICE promotion or Cloudflare/Cloud Run/DB edits until explicit approval and TEST acceptance.
