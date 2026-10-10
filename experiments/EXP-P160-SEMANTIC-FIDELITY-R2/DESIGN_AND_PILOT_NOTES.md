# EXP-P160-SEMANTIC-FIDELITY-R2 — TEST-ONLY DESIGN AND PILOT EVIDENCE
2026-10-10 — STRUCTURAL PROMPT EXPERIMENT, NOT SERVICE, NOT A VERIFIED QUALITY IMPROVEMENT.

## Baseline and preserved runtime
P160A original source canonical SHA: 422e1d8fa4b51c790d385a2d314da1e99de31681198a0e69183d57a9be2fe639.
R2 independently rewrites the 2 forward instructions from the P160 original rather than stacking incremental R1 patches. All 8 SMART and 4 back templates are byte-identical to P160. Model, current TEST single-pass runtime, SERVICE V3.61.209/P168A R8/G158A, all app code, relay, STT, TTS, database and HISTORY untouched.

## Real-use log RUN-20261010-215408-b07cca: 20 actual A=P160 versus B=older R1
10 K2L and 10 L2K, 0 outer client single-pass failures, 80 attempted generations. This does NOT include R2 results; backend/provider retries UNKNOWN.
CASE 011: R1 introduced exact 2–3 days where source had only indefinite days; source scope narrowed. Core source commitment/uncertain quantity failure.
CASE 018: R1 replaced general food with meal/rice; narrower item than source.
CASE 003/005: a piece of good news became many good-news events, an intensity-versus-plurality substitution. Near-duplicate originals are not independent evidence.
CASE 020: explicit father's older brother's daughter became generic cousin, losing source kinship detail.
CASE 002: R1 avoided original P160A unsupported bus-driver job specificity; retain this gain.
CASE 004 register difference and CASE 006 cause-vs-sequence/back translation require bilingual semantic adjudication.
CASE 012/014/016 STT-like malformed inputs: any confident interpretation requires source review; unknowns should not be patched into a fabricated story.
CASE 011 original P160 back turns inclusive suggestion into polite directive; reverse quality cannot be inferred from round-trip similarity.

## Measured pilot latency (A=P160, B=R1 only; R2 untested)
K2L firstDisplay average A 2762.9ms, R1 3440.6ms; p95 A 6363.3ms, R1 7596.8ms. L2K average A 2196.6ms, R1 2210.1ms. 10 cases/direction too small for reliable performance certification.
R2 k2l forward chars 3243 (P160 3591, R1 3923); R2 l2k 3391 (P160 3583, R1 3762). Shorter prompt does not prove higher speed.

## R2 structural rationale and regression strategy
1. Preserve exact asserted propositions and uncertainty BEFORE stylistic naturalization; explicit roles and speech act override couple defaults.
2. Protect count, singular/plural, duration and identity scope, degree versus number of incidents, generic item versus specific item; do not hardcode example-specific word banlists.
3. Condition versus fact, suggestion versus command, time/aspect and reason versus sequence protected on both directions.
4. Couple intimacy comes from actual source, never arbitrarily intensify or apply to quotations; preserve source feeling and register.
5. STT ambiguity stays uncertain. Avoid guessing missing actor/reason/document stage or inventing role.
6. Keep SMART and independent backs untouched as comparison control, but R3 reviews all four paths. Future confirmed back problems should be a separate diff.

## R3 release gates
A=P160A pinned exact SHA. B=EXP-P160-SEMANTIC-FIDELITY-R2 SHA 2879e76ce584a018dfcd2b479911e4931772bc52ac581647dae0d891fdc63910. FORWARD scope, isolated A/B TEST single-pass same code.
Run balanced first 20 non-identical real-use samples, then holdout 100 K2L50/L2K50, independent back from actual forward only. Audit role, conditions, negation, time, count, food, social relationships, subtle emotional changes, naturalness/readability and both-language register. Compare firstDisplay avg/p50/p95, forwardTotal, backTotal, requests, cost. Any unexplained serious regression or consistent slow-down => HOLD/REJECT. Native Lao review not performed => LAO_NATIVE_UNVERIFIED. This note is design evidence only, not a quality PASS.
