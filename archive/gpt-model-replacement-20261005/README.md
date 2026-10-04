# GPT MODEL REPLACEMENT RESEARCH — ARCHIVED 2026-10-05

Status: **CLOSED / REJECTED AS PRIMARY TRANSLATION ENGINE**

Current live SERVICE remains **V3.61.208 / P168A / G158A / gemini-3.8-flash**.

## Final decision
The direct GPT replacement line is closed. Final R8 used 50 frozen real-use rows (25 K2L + 25 L2K), 50 approved examples, the same 4 selected examples per comparison case, and excluded approved-example source overlap from evaluation. All 500 planned calls completed with 0 runtime errors, but GPT did not establish clear semantic superiority over Gemini and remained materially slower.

Forward average total latency in final R8:
- Gemini SERVICE: 1737 ms
- Gemini + few-shot: 1395 ms
- GPT-6 Astra + few-shot: 5126 ms
- GPT-6.1 Sol + few-shot: 5593 ms
- GPT-6 Luna + few-shot: 4007 ms

Few-shot is **not adopted for live SERVICE**. Keep P168A + current SMART behavior.

Google/Chrome STT V203–V206 follow-up was separately closed by user decision on 2026-10-05; SERVICE STT/TTS remains unchanged.

## Preserved research files
These root-level files are intentionally preserved at their historical URLs as evidence. They are not active SERVICE components.

- `model-compare-test.html` — early Gemini/GPT comparator, blob `10009168e117af679a6cf702aeaefda67b0c0519`
- `gpt-prompt-compact-r1.json` — GPT compact prompt, blob `60cf50eea7baaf7bc437e61a25e49ac62f69e90e`
- `model-compare-gpt-compact-test.html` — compact comparator, blob `68acd23ddbc0e6338be59340ab2f5f45729ce1b7`
- `gpt-prompt-minimal-r1.json` — GPT minimal prompt, blob `40887809831830867251246fc540d198b7a5e5c7`
- `model-compare-gpt-minimal-test.html` — minimal comparator, blob `c90f24d27053bf4f00ef4cf5005886bf9f9cdcf0`
- `model-compare-all-r6-test.html` — all-model streaming R6, blob `3a9cfc6cfe779fe0ba22b1c48d0204b08c394589`
- `model-compare-p168-same-r7-test.html` — final integrated R8 workflow preserved under historical filename, blob `13321cba2632269e2244b20fb7e6ff47e6de081a`
- `approved-examples.json` — R8 research-only approved example library, blob `3a5b0ed37476e3b9326c1eb26da92ad479064fa5`

## Do not use as live path
Do not reactivate these files, GPT prompt tuning, fast-tier tests, or dynamic few-shot for SERVICE unless the user explicitly reopens the research with materially new evidence.

Official SERVICE files remain `index.html`, `prompt-config.json`, `version.json`, and `diagnostic.html`.
