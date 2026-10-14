# 2026-10-14 TEST direct text / speech relay routing staging R1

Status: **STAGED IN ISOLATED TEST BRANCHES; NOT DEPLOYED.** No paid Gemini/provider calls. No SERVICE, Cloud Run, Cloudflare Worker, database, or prompt changes.

## User intent
- Both couple modes, both forward and independent back-translation, plus general interpreter: **direct Gemini API**. One generation per stage; no automatic same-request Cloudflare/Cloud Run fallback/replay for translation.
- Speech/STT/TTS: husband **Cloud Run first**, wife **Cloudflare first**. Preserve established speech-specific recovery paths and Laos accessibility requirements.
- First validate TEST, then consider SERVICE promotion only after separate authorization and real-device acceptance.

## Staged repositories (NOT merged to deployed/main)
- Couple TEST repository `martin830000-spec/wife`: `test/text-direct-speech-relay-20261014-r1`. Parent: existing single-pass TEST branch `test/single-pass-couple-runtime-20261010-r1`.
- Pages TEST presentation `martin830000-spec/laos-translator`: `test/text-direct-speech-relay-20261014-r1`. Production Pages main not modified.
- General interpreter TEST `martin830000-spec/korean-lao-general-test`: `test/text-direct-speech-relay-20261014-r1`. Public TEST Pages main not modified.

## Code changes
- Couple embedded husband+wife `fetchPrimaryDirect`: remove preselection of Cloudflare for wife/generation and husband adaptive generation. All text `generateContent` requests use the original direct fetch and retain existing `isSinglePassGenerationPath` no-replay guard for errors.
- Couple `networkRoutePreferred('stt'/'tts')`: fixed mode-specific primary, husband `direct` to Cloud Run, wife `cloudflare`. Voice WebSocket selection and REST paths use this function. No changes to Worker or relay endpoints.
- General `geminiRequest`: direct `directGemini` only, no TypeError/5xx automatic relay fallback. Payload LOW preserved.
- General `networkPreferred('stt'/'tts')`: chooses primary based on `state.userMode`. `/gemini/audio-transcribe` now correctly classified as STT for relay path selection.
- Coupled index `data-sha256` payload attributes regenerated and checked; embedded prompts intact. General embedded payload checksum regenerated and checked; prompt intact.
- Test-only `version.json` updated. SERVICE version/revisions unchanged.
- Existing couple TEST `tests/single-pass-r1.test.cjs` updated for direct text and new speech assertions; `tests/h2-single-pass.test.cjs` unchanged. General new `tests/text-direct-routing.test.cjs` added.

## Offline CI evidence
- Couple: https://github.com/martin830000-spec/wife/actions/runs/38540635147 - SUCCESS, offline Node mock regression.
- General: https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38540713767 - SUCCESS, offline Node mock regression.
- Payload JS syntax, embedded checksum, LOW, one direct generation, and primary speech route assertions were checked. No real network/provider generation during validation.

## Constraints and remaining gates
1. Existing user-visible TEST sites still load their unchanged deployed main branches. Staging is **not a TEST deployment**. Obtain separately authorized TEST deployment before on-device testing.
2. User to validate actual direct Gemini reachability from Lao iPhone and Korean Android/desktop; Cloud Run reachability alone is not a proxy for Gemini availability.
3. Validate STT/TTS on both phones, wife Cloudflare forwarding, independent four-path translation, failure no-replay behavior, telemetry, network route display, cost and first-display latency; confirm H2 dynamic clones pick up the deployed Pages TEST index.
4. After actual testing and explicit approval, plan SERVICE promotion across separate `wife/main` and `korean-lao-general/main`, with rollback snapshot. No authorization yet.
5. Some general multilingual STT languages may use existing direct audio fallback because relay capabilities differ. This routing change targets normal text and STT/TTS relay primary; it does not change all STT recognition algorithms.
