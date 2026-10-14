# 2026-10-14 Network route UI correction — TEST candidate R2

Status: **STAGED ONLY — NOT DEPLOYED**. No API requests, Cloud Run, Cloudflare Worker, DB, or SERVICE modifications.

## Source and intent
The user confirmed deployed R1 TEST works. Follow-up offline audit found the old network-choice controls misleading, because text forward/back translations are already direct Gemini single-pass, regardless of stored route preference. The user requested continuation.

## R2 staging locations
- Couple TEST development: `martin830000-spec/wife`, branch `test/network-clarity-stt-20261014-r2`.
- Couple public Pages TEST candidate: `martin830000-spec/laos-translator`, same branch.
- General interpreter TEST candidate: `martin830000-spec/korean-lao-general-test`, same branch.

## Changes
- Removed outdated auto/direct/Cloudflare priority claim from visible network setting descriptions.
- Hidden **only** obsolete network selection toolbar; retained underlying legacy button elements, storage keys and route functions to avoid destructive state changes and ensure compatibility.
- Actual text Gemini direct, LOW and single-pass, independent back translation, STT/TTS, relay, language selection, history, H2, and data logic **unchanged**.
- Couple UI says: text direct Gemini; husband audio Cloud Run first / wife audio Cloudflare first. No automatic text retry.
- General UI says the same, but accurately discloses a **known conditional exception**: some multilingual STT AI recovery uses direct Gemini for languages unsupported by native relay STT or following relay errors.
- General embedded and shell build string `20261014-V3.61.202-TEST-ROUTE-UI-R2`. Couple manifests `20261014-V3.61.209-TEST-ROUTE-UI-R2`.
- Recomputed embedded payload SHA256 (husband/wife/general), verified JavaScript parsing and continuity in source.
- No change to SERVICE `V3.61.209 / P168A R8 / G158A` or general SERVICE `V3.61.207`. Future general SERVICE integration must start from V207, not overwrite with V202.

## Automated tests on 2026-10-14
1. Couple Pages TEST candidate: 8 passed / 0 failed. https://github.com/martin830000-spec/laos-translator/actions/runs/38551050487
2. General TEST candidate: 6 passed / 0 failed. https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38551068554
3. Couple TEST runtime: 33 passed / 0 failed. https://github.com/martin830000-spec/wife/actions/runs/38551078477
**Total 47/47 passed** with no paid API/provider calls. Static and mock tests are not a replacement for manual runtime test.

## STT follow-up held intentionally
General `aiTranscribe` uses direct Gemini for nonnative languages and after some relay errors. Current relay fallback language set defaults to ko-KR and lo-LA; an audit of the **deployed Cloud Run 3.7.17 audio transcription endpoints and supported languages** is needed before removing direct STT. Do not break multilingual STT or assume a backend route can handle unsupported languages. No general STT algorithm change in R2.

## Release gates
- Deployed R1 is still live and user-confirmed functional.
- R2 requires separate TEST Pages deployment authorization; no production merge.
- Revalidate network setting copy, husband/ wife audio and general alternate-language STT on devices. Keep R1 as rollback.
- Later SERVICE promotion: separate comparison against latest general SERVICE V207 + husband/wife SERVICE frozen until approved.
