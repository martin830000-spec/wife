# TEST direct-text release — full offline audit R2
Date: 2026-10-14
Scope: deployed TEST pages for couple and general app, unchanged SERVICE and infrastructure.
Status: OFFLINE CODE AUDIT PASS with follow-up issues; not SERVICE release approval.

## Provenance
- Couple TEST Pages `martin830000-spec/laos-translator/main`, `index.html` Git blob `2316d35f2172183580e95df94b2b2f5bcc6b54ae`, `version.json` build `20261014-V3.61.209-TEST-TEXT-DIRECT-R1`.
- General TEST Pages `martin830000-spec/korean-lao-general-test/main`, `index.html` blob `4cc185a1481c1b8ec85b0a8c12cdfe214ff9888c`, `version.json` build `20261014-V3.61.202-TEST-TEXT-DIRECT-R1`.
- Couple TEST dev `martin830000-spec/wife/test/single-pass-couple-runtime-20261010-r1`, same payload code as TEST Pages with TEST channel shell.
- Couple SERVICE `martin830000-spec/wife/main`, `index.html` blob `320c461137d03eed86986d1625aa873e29b81e3f`, version V3.61.209 P168A R8 G158A.
- General SERVICE `martin830000-spec/korean-lao-general/main`, `index.html` blob `8d13a8969524ecb1b4f39f2621a981ababa63a83`, version V3.61.207; G158A.
- Confirmed from user: TEST apps worked on device. No new paid Gemini/STT/TTS calls from audit; no live network fault injection.

## Evidence: 45 passing offline tests
- Couple TEST: `https://github.com/martin830000-spec/wife/actions/runs/38543678352`: 33 passed, 0 failed.
- General TEST: `https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38540713767`: 5 passed, 0 failed.
- Pages-TEST independent integrity audit: `https://github.com/martin830000-spec/laos-translator/actions/runs/38545151734`: 7 passed, 0 failed.
  Checks: deployed index/version consistency, decoded embedded payload SHA256 and JS parser, live Pages H2 SHA256 manifest parity and JS parser, direct Gemini forward/back and no preselect, STT/TTS mode-based primary, no duplicate literal DOM IDs, no obvious hardcoded Google API keys/private-key PEM patterns.

## Implementation facts
- Text `fetchPrimaryDirect` on K2L/L2K always calls `fetch(url,options)`; original relay-preselect branch removed. `isSinglePassGenerationPath` prevents same request relay retry for text `:generateContent`, except unrelated STT/meta paths.
- General `geminiRequest` calls `directGemini` once and no automatic `relayGemini` fallback.
- Direct Gemini payload has `thinkingLevel:'low'` / `includeThoughts:false`.
- Voice REST/WS/TTS routing primary chooses Cloud Run for husband; Cloudflare for wife; original voice failovers still exist.
- Prompt-config git SHA identical between couple SERVICE and TEST; general TEST and general SERVICE prompt-config git SHA identical. No prompt modifications.
- H2 Pages diagnostic is a different, more recent variant than the H2 in wife TEST development repo; both should be evaluated separately. Pages H2 integrity itself passed.

## Findings / priority
1. **CONFIRMED UI MISMATCH (medium)**: network setting screens still offer direct/Cloudflare priority and promise automatic switching, while text translation is fixed to direct and doesn't automatic-switch. STT/TTS primary is mode-fixed. User-selectable network mode is misleading for these calls.
2. **SERVICE RELEASE PARITY GAP (medium, promotion blocker)**: general TEST V3.61.202 vs general SERVICE V3.61.207. Must base future general SERVICE candidate on V207 and merge only validated direct-text/voice deltas. Source notes state G158A translation logic unchanged between these builds, so do NOT claim current TEST has a measured translation-quality regression.
3. **GENERAL STT EXCEPTION (medium, conditional)**: `aiTranscribe` performs `directAudioTranscribe` for languages outside `generalRelayNativeStt`, and as fallback after relay failure for native-capable STT. Thus a voice STT request can bypass Cloud Run/Cloudflare even though normal relay paths prioritize them. Separate from *text translation* direct policy. Needs design choice if strict all-STT-via-relay is required; unsupported relay language behavior must not be silently broken.
4. **GENERAL CUSTOM RELAY EXCEPTION (low, conditional)**: `relayRoutes` puts nonstandard `state.relayUrl` custom endpoint first even for STT/TTS, before mode-specific Cloud Run/Cloudflare. This matters only when such a custom endpoint is configured; not proof user has one.
5. **CREDENTIAL RISK (operational, not new bug)**: Direct browser Gemini calls require an API key accessible to the client runtime. No literal Google API key was detected hard-coded in the public TEST HTML by simple signature scans, but this is not proof against all leakage; Google advises restrictions, spend quotas/alerts and avoiding unrestricted client credentials. Restricting keys without validating both device origins could break service.
6. **LEGACY DEAD CODE (low)**: husband runtime still declares obsolete `requestGeminiWithHedge`/tail-rescue functions and instrumentation though real forward path uses one `createGeminiRequest`. Current tests did not observe hidden retries. Removal later should be separately regression-tested.
7. **VOICE FAILOVER OBSERVABILITY (unverified)**: wife WebSocket candidates still list Cloud Run direct as secondary after Cloudflare. Can cause delay when unreachable in Laos; user-confirmed normal use does not establish outage behavior.

## Next action
- Do not modify SERVICE yet. Implement TEST-only clearer network labels, resolve STT routing policy, guard custom relay priority if required. Check actual native-language STT and failover on both devices; audit client-key restrictions safely. Before SERVICE promotion merge direct-text change into latest general SERVICE V207, not V202.
- No need to repeat costly translation A/B if actual prompt was unchanged and task is only routing parity. More extensive translation-quality study is separate.
