# 2026-10-14 — R2 + R3 GitHub Pages TEST Release Audit R1

**STATUS: PAGES CI DEPLOY SUCCEEDED (both apps). NO SERVICE/BACKEND/DB/H2 modifications.**

## Scope and provenance
User approved publishing the existing verified R2 network/STT improvements and R3 Android Google voice typing keyboard-return experiment to the two TEST GitHub Pages applications.
- Couple TEST: https://martin830000-spec.github.io/laos-translator/
- General TEST: https://martin830000-spec.github.io/korean-lao-general-test/

**Protected**: wife/service main (V3.61.209 / P168A R8 / G158A), general production repository `martin830000-spec/korean-lao-general` (SERVICE V3.61.207), Cloud Run, Cloudflare, operational DB and history, H2 and existing test logs. Model Gemini 3.8 Flash / LOW, original prompt files and single-pass translation runtime unchanged.

## Release transactions
| TEST repo | PR (merged) | main merge commit | R3 staged & merged index.html Git blob |
| --- | --- | --- | --- |
| Couple `laos-translator` | https://github.com/martin830000-spec/laos-translator/pull/4 | `b0d994aaa107acfa0d365f1cdbfe912e13963052` | `6bc5f22cd2921833572e5e58178cbee0a822c918` |
| General `korean-lao-general-test` | https://github.com/martin830000-spec/korean-lao-general-test/pull/1 | `81017889403c986a109bd5c2df207ba9a9d6026a` | `1c37d52487ab5ff34ad5f61b1d75933b4e3d2d2b` |

Both main index.html Git blobs were fetched **after merge** and matched the R3 candidate Git blobs byte-for-byte by SHA. Main prompt-config blobs were unchanged: couple `b1323967ef529e0c960d6e7ab707ea43659b8b6a`; general `a75b9c221732e98afa54550123fe027677521fa9`. The R3 candidate embedded SHA-256 was verified in automated tests.
- Couple embedded husband: `02a9887994c955bf902f2815a76bd9f29c68520de1d1f88af1ba636a7702300f`
- Couple embedded wife: `9f74cd96db721b5421a48d8ac0535cef8447be2dec85e536572778241f5c8b67`
- General embedded: `5256eb32ef6631261005345fb1e4c082bb5dafecea22ac518abf5e93cdc09a60`

Visible build IDs:
- Couple `V3.61.209 / 20261014-V3.61.209-TEST-VOICE-IME-R3`
- General `V3.61.202 / 20261014-V3.61.202-TEST-VOICE-IME-R3`
- General SERVICE V3.61.207 **not promoted or replaced**.

## Verified post-release GitHub automation
| TEST repo | Main regression | Pages build/deploy |
| --- | --- | --- |
| Couple | https://github.com/martin830000-spec/laos-translator/actions/runs/38570446000 — **10 PASS, 0 FAIL** | https://github.com/martin830000-spec/laos-translator/actions/runs/38570446291 — **build/deploy/report succeeded** |
| General | https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38570459097 — **11 PASS, 0 FAIL** | https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38570457675 — **build/deploy/report succeeded** |

The existing `wife` R3 development-source suite previously passed 43/43, so across the three codebases the R3 test suites previously totaled 64 invocations, while 21 TEST Pages invocations were additionally verified **after main merge**. No paid translation/API stress reruns.

## Limits / pending device QA
- The public GitHub Pages URLs could not be independently downloaded through this execution environment (web cache miss, container DNS blocked); **direct HTTP contents/served-byte verification is NOT claimed**. GitHub Pages Actions reported deploy success to public Pages site on the corresponding main commits.
- Android OS Google Voice Typing IME is outside page control. The R3 `blur`/optional VirtualKeyboard.hide/`focus` UX is **best effort**, not proven to switch the Google voice panel to the normal keyboard. User should test with Galaxy Z Fold device; if no automatic change, try the `⌨ 자판` button; if still not, Google voice panel upper-left back arrow remains required.
- Verify previously dictated text retained, manual typing/cursor edit, both couple directions and general mode, audio STT/TTS on Galaxy and wife's Laos network. The R2 general native server /gemini/audio-transcribe feature-support verification remains pending; existing unsupported-language direct Gemini STT fallback intentionally preserved.
- No SERVICE promotion without explicit further instruction. For any future general SERVICE promotion, reconcile V3.61.207 features before upgrading.

Append-only evidence. Earlier R2 and R3 staging audit files remain intact.
