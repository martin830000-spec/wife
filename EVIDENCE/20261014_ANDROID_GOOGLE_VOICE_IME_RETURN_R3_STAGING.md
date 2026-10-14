# 2026-10-14 Android Google Voice IME → Keyboard Return R3 — TEST STAGING

STATUS: **TEST BRANCHES COMMITTED / MOCKED + STATIC CI PASS; NOT DEPLOYED to GitHub Pages main; NOT SERVICE.**
R2 baseline evidence and installed server/DB/history/prompt remain unchanged.

## User-reproduced symptom
On Android Chrome / Samsung Galaxy the separate Google voice typing keyboard occupies the lower screen. Its top-left backward arrow exits to ordinary keyboard. Tapping the existing focused app textarea does **not** exit voice keyboard.

## Implementation and scope
- Three isolated TEST candidate branches: `test/android-google-ime-keyboard-return-r3-20261014` in `martin830000-spec/wife`, `martin830000-spec/laos-translator`, and `martin830000-spec/korean-lao-general-test`.
- Android-only small keyboard-return control in each input header (husband `krInput`, wife `loInput`, general `input`). No DOM change on iPhone.
- Best-effort gesture-bound `input.blur()`, optional `navigator.virtualKeyboard.hide()`, then `input.focus({preventScroll:true})` restoring selection. Never rewrites textarea value or sends input/translation API requests.
- Automatic attempt only when the **already-focused** textarea is touched after a recent (30 seconds) trusted, non-paste, non-composition, bulk/dictation-like text insertion. Ordinary small typing and cursor tapping are not intercepted. Heuristic may miss some Google voice streams or false-arm after other bulk input, so an explicit button provides a controllable fallback.
- Web pages **cannot directly invoke Android Google IME back arrow or force the current IME to change to a normal keyboard**. If the attempt fails, the Google voice panel's ← button remains the reliable manual method. Real Galaxy test required; mock tests do not prove IME behavior.
- The R2 network UI + voice relay corrections, Gemini 3.8 Flash / LOW, prompt configs, Single Pass, four-lane forward/back runtime, Cloud Run/Cloudflare backends, H2 and all SERVICE unchanged.

## SHA and versions (verified from GitHub candidate)
- Husband embedded SHA256: `02a9887994c955bf902f2815a76bd9f29c68520de1d1f88af1ba636a7702300f`.
- Wife embedded SHA256: `9f74cd96db721b5421a48d8ac0535cef8447be2dec85e536572778241f5c8b67`.
- Same exact husband/wife payload SHAs in `wife` and `laos-translator`.
- General embedded SHA256: `5256eb32ef6631261005345fb1e4c082bb5dafecea22ac518abf5e93cdc09a60`.
- Couple version/build: `V3.61.209 / 20261014-V3.61.209-TEST-VOICE-IME-R3`. General: `V3.61.202 / 20261014-V3.61.202-TEST-VOICE-IME-R3`. General inner/outer build markers match.
- Couple prompt-config Git blob `b1323967ef529e0c960d6e7ab707ea43659b8b6a`; general prompt-config blob `a75b9c221732e98afa54550123fe027677521fa9`. No prompt changes.

## Automated QA (paid Gemini calls: zero)
- Wife source: 43/43 PASS, 0 FAIL https://github.com/martin830000-spec/wife/actions/runs/38568474972
- Couple Pages branch: 10/10 PASS, 0 FAIL https://github.com/martin830000-spec/laos-translator/actions/runs/38568495255
- General branch: 11/11 PASS, 0 FAIL https://github.com/martin830000-spec/korean-lao-general-test/actions/runs/38568676806
- Aggregate 64 test invocations, 0 final failures; some cross-repo parity tests are duplicated.
- Checks include: all embedded SHA256 payloads and executable JS parse; R2 baseline payload exact parity after removing R3 script and build label; Android affordance and trusted dictation-like touch; regular typing, composition, paste and synthetic events do not auto-switch; copied text unchanged; non-Android no controls; version alignment; R2 voice route and Single Pass regressions.
- The earlier general CI attempt failed only because inherited R2 test asserted an obsolete R2 build ID; corrected the assertion to R3, rerun 11 PASS. No product failure from that run.

## Release guard
- R3 candidate **is not available at current GitHub Pages TEST URLs**, which still serve previous R1. No Pages main changes or SERVICE changes were made.
- Next after **separate TEST deployment authorization**: verify on Galaxy using keyboard's Google voice typing; test whether re-tap returns to ordinary keyboard; test explicit button; test ordinary typing/cursor selection, text preservation and translation; test wife's Lao and general modes, iPhone no regression. If it does not switch, do NOT falsely claim fix: Google back arrow still required; revert experiment if it disrupts editing.
- Promotion separately requires general SERVICE V3.61.207 merge, four-path review and real-user evidence.
