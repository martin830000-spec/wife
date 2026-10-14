# 2026-10-15 R3 Android Google Voice IME Failure → TEST R2 Rollback R1

**Decision: R3 IME workaround REJECTED / ROLLED BACK from both GitHub Pages TEST sites at the user's explicit request.** User tested the published R3 on real Galaxy and confirmed it did not switch the separate Google voice typing screen to the ordinary keyboard. Do not reintroduce the `blur()/VirtualKeyboard.hide()/focus()` R3 experiment or its "⌨ 자판" button without a new user request.

**Scope:** revert *only R3*. Keep R2 network UI, speech Cloudflare/Cloud Run routing improvements, preserved direct Gemini Single Pass and prompt-config, existing API settings, DB and H2. Production SERVICE **not touched**.

| TEST deployment | Restored app Git blob SHA (byte-identical to R2) | Final PR & merge SHA | Release CI | GitHub Pages deployment |
| --- | --- | --- | --- | --- |
| Couple `martin830000-spec/laos-translator` | `91931f3c5c7bd224baeabfa97389ce7b1b871c96` | [PR #5](https://github.com/martin830000-spec/laos-translator/pull/5), `a2ddcf9e79c15f4d6fa6afaf25a82946c267e952` | [4/4 PASS](https://github.com/martin830000-spec/laos-translator/actions/runs/38639313200) | [success](https://github.com/martin830000-spec/laos-translator/actions/runs/38639311447) |
| General `martin830000-spec/korean-lao-general-test` | `66560fa54b3f0a501b6561ce67482599ad4a47ba` | [PR #2](https://github.com/martin830000-spec/korean-lao-general-test/pull/2), `f06994e59b49ed2a1e42a8acf28600fe9c1e95e7` | [5/5 PASS](https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38639323977) | [success](https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38639322660) |

**Restored TEST build IDs:** couple `V3.61.209 / 20261014-V3.61.209-TEST-VOICE-UI-R2`; general `V3.61.202 / 20261014-V3.61.202-TEST-VOICE-UI-R2`. The R3-only Android input-handler, visible "⌨" button and R3-only tests were removed from TEST main. The general-app inherited R2 build assertions were restored. R3 commits/diagnostic evidence remain in Git history and separate branches, not deleted from project history.

**Preserved R2 runtime embed SHA-256** (per prior R2 verification): husband `35a5d0a6110bba62988c1b26b1f800ebe93cb51af070fee3f4063293a1ad20b0`; wife `3a75245234dde87df9e8fec45dd51adbf18f0138115097bf1152ca8f6778b076`; general `04e86b4989bb9471bbb0464eae6a2849c55c8d0404ce0c31eca4ca02a86ac09c`. Prompt config Git blobs unchanged: couple `b1323967ef529e0c960d6e7ab707ea43659b8b6a`; general `a75b9c221732e98afa54550123fe027677521fa9`. Gemini 3.8 Flash / LOW preserved. No paid Gemini tests or new calls.

**SERVICE protection independently confirmed:** `martin830000-spec/wife` main head `8b26aedb04d0e395069b511d325244b3bdcebaa5` unchanged; `martin830000-spec/korean-lao-general` main head `f8cf8439f7349475a512803b41f55e8aaff90693` unchanged. No Cloud Run, Cloudflare, H2, production DB/history changes.

**Verification caveat:** GitHub Pages build/deploy workflows confirmed successful for both rollback merge commits, but direct retrieval of published HTML by external browser was not possible in the execution environment. User's Android Google dictation OS-level UI behavior remains outside website control; Google panel's own back arrow restores keyboard.

**Current decision:** R2 is the active TEST candidate on both published Pages URLs. No SERVICE promotion. Treat R3 as rejected and preserve prior R2 improvements.
