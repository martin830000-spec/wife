# EXP-P160-SEMANTIC-FIDELITY-R3 — R2 real-log audit and paste-only candidate
Date: 2026-10-11 KST. STATUS: isolated experiment, not yet measured with live R3 Gemini; SERVICE HOLD.

## Real H2 input
Uploaded RUN-20261011-031907-a499be, real-use DB20 (10 K2L, 10 L2K); A=P160A SHA 422e1d8fa4b51c790d385a2d314da1e99de31681198a0e69183d57a9be2fe639; B=EXP-P160-SEMANTIC-FIDELITY-R2 SHA 2879e76ce584a018dfcd2b479911e4931772bc52ac581647dae0d891fdc63910.
20 cases, 80 attempted translation calls, no reported partial errors, zero observed client forward single-pass failures in each lane. BACK_DETAIL_JSON=null in all 20 cases, thus back single-pass trace is not independently established even though all back texts and times are present. Provider retries remain unknown.
Measured firstDisplay mean in ms K2L A=2297.4, R2=1923.8 (R2 faster 373.6ms); L2K A=1765.1, R2=1885.7 (R2 slower 120.6ms); ALL A=2031.3, R2=1904.7 (R2 faster 126.6ms). R2 firstDisplay p95 K2L 2629 vs A 5818.2, L2K 3264.1 vs A 2120.0; tail behavior unsettled, samples n=10/dir. First display is clone-local; forward wall includes initialization/queues.

## Symptom taxonomy based on both forward and independent back
CASE003 and CASE005 K2L similar user messages: '너무 좋은 소식' became '좋은 소식이 아주 많다' in R2 Lao/ Korean reverse. This is INTENSITY versus EVENT COUNT confusion; CASE005 nearly duplicates CASE003 and must not be counted as separate independent evidence.
CASE004 L2K B '큰아버지 댁 언니' loses explicit older-uncle's daughter relation. CASE006 B '사촌 언니' flattens that relation. CASE012 B '외삼촌 딸' substitutes a different family-side relation. Use source kinship structure, don't invent paternal/maternal branches; Lao native specificity review desirable.
CASE010 L2K B '숙제 하나도' versus source ຈັກໂຕ (individual written characters) loses exact count unit. Korean A retained '한 글자도'.
CASE008 L2K B unexpectedly formal '-요' versus A banmal. Lao initial acknowledgment ໂດຍ may support polite response, hence context-specific review; do not label one as certain error without register context.
CASE011 K2L R2 forward preserved nonnumeric '며칠' rather than R1's invented 2–3 days (improvement); Korean reverse B '참아줘' still shifts collective '참자' to addressee-directed request.
CASE018 L2K B '바로 배달해 줄게' introduces an agent and promise not clearly present in highly segmented STT-like Lao; suspicious, not a confirmed original-intent verdict.
CASE020 L2K B independent Lao reverse ends with Thai-script ค่ะ, unequivocal output-script contamination. Also B Korean forward '앱에서 음식 받아서' may wrongly assert who received the order versus app reported status.
CASE002 B '버스 운행' preserves work breadth and avoids P160's unsupported '버스 운전' (a gain); maintain this.
Other ordinary cases 001,007,009,013,014,015,017,019 are mostly usable with secondary tone/naturalness risks; native Lao naturalness quality remains independently unverified.

## New B EXP R3
Candidate EXP-P160-SEMANTIC-FIDELITY-R3 canonical SHA 15c91b9292b081e39fad1c8d9a66fb6aa479b477feec80ef9277a3aa608ce272.
EXACT paste-ready file: experiments/EXP-P160-SEMANTIC-FIDELITY-R3/B_CANDIDATE_PASTE_IN_H2_SCOPE_ALL.txt; parallel prompt-config.json is byte-identical (Git blob b9f2632671f4a5b7af39a339ece23260c821b40f).
Changed fields vs R2: forward.k2l, forward.l2k, back.husband, back.wife. SMART 8 fields and both back recovery fields unchanged, schema intact. R3 forward lengths K2L 3152 vs R2 3243; L2K 3357 vs R2 3391. Shorter prompt does not guarantee latency improvements. No runtime code, app prompt-config, SERVICE, H2 HTML, GitHub Pages, STT/TTS, relay, Cloud Run or production modified in this iteration.
Forward structure now places count vs intensity distinction, precision, family-tree relations, roles, mutual proposal, STT uncertainty and script purity explicitly. Back direction adds independent source-only role/collective speech-act and Thai-output exclusion without hidden retries. This is a hypothesis, not a confirmed fix.

## Manual H2 comparison
Keep A=P160A immutable. Paste ENTIRE R3 TXT JSON into B textarea; IMPORTANT choose scope=ALL (not FORWARD) because back.husband and back.wife are intentionally changed. H2 recalculates candidate SHA; check log B_REV and expected B_SHA after actual run. Prefer one wider holdout e.g. 50 balanced real DB instead of repeatedly the same 20 recent phrases; log can have overlapping previous sources. R3 rule evaluate 4 paths equally and compare latency. Reject serious new regressions, Thai/English intrusion, count, emotion or family relation changes, or consistent tail slowdown. Do not promote without separate user approval.
