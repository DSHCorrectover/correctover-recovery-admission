# Integrating Correctover Recovery Admission

Written for embedders — platform, framework, and security teams that already have an agent runtime and are missing parameter-level authorization semantics.

## 1. Minimal integration
```yaml
- uses: DSHCorrectover/correctover-recovery-admission@v0.1.0
```
Pinned (supply-chain locked):
```yaml
- uses: DSHCorrectover/correctover-recovery-admission@c2eaf3b
```
**Input:** your agent's action records (the workflow points the verifier at your action log or replay file).
**Output:** per-action verdicts + a machine-readable report artifact (recovery-admission-report.json), recomputed against the published 576-anchor decision table. The verifier is installed from the published PyPI artifact inside the workflow — never from a checkout of this repo.

## 2. Verdict contract
- **PASS** — the action is within the authorization actually granted, parameter by parameter.
- **MISMATCH** — the action exceeds granted authorization, on at least one parameter. This is a finding, with a published reason code you can cite.
- **ESCALATE** — the table cannot decide within its declared scope (e.g., an irreversible action lacking an explicit approval gate). **ESCALATE is not a rejection** — it means "this needs a human or an explicit gate decision before proceeding." It is the honest third state, not a soft no.

## 3. What this does NOT do
Read this section before involving your security team — it is where we draw the line:
- **Not a runtime interceptor.** This judges action records after the fact (CI / audit time). It does not sit in your agent's execution path and cannot block anything live.
- **Not a credential validator.** It does not judge whether credentials are genuine, unexpired, or correctly scoped at the infrastructure level — that is your IAM system's job.
- **Not a SAST/DAST replacement.** It does not scan code for vulnerabilities and does not overlap with what Semgrep, Snyk, or CodeQL produce. It reads behavior records, not source code. If your product scans code and your agent runtime needs admission semantics, we are complementary by construction.
- **Not a deployed-system attestation.** A green verdict proves your action stream matches the admission semantics — it does not prove your production deployment is safe. We will refuse to sign a broader claim in writing (see HONESTY.md).

## 4. Licensing & legal
- Decision-table dataset: **CC0** (public domain — the data is yours to fork, mirror, or re-derive)
- Verifier code: **Apache-2.0** (static linking and redistribution fine; no CLA)
- No telemetry, no phone-home. Verdicts are computed entirely in your runner.
