# Integrating Correctover Recovery Admission

Built for embedders. Three facts that usually decide integration:

## 1. One line to run
```yaml
- uses: DSHCorrectover/correctover-recovery-admission@v0.1.0
```
Or pinned (supply-chain locked):
```yaml
- uses: DSHCorrectover/correctover-recovery-admission@c2eaf3b
```

## 2. The verifier never runs from a checkout
It is installed from the **published PyPI artifact** inside the workflow. Your CI result does not depend on the state of this repository.

## 3. Licensing clears legal review
- Decision-table dataset: **CC0** (public domain)
- Verifier code: **Apache-2.0**
- No CLA, no phone-home, no telemetry. The verdict is computed in your runner.

## What this integrates as
A parameter-level admission check for delegated agent actions: whether an agent's action exceeds the authorization actually granted — judged per parameter, with explicit ALLOW / BLOCK / ESCALATE verdicts and published reason codes.

## Honest scope (also in HONESTY.md)
This proves the **admission semantics**, not that your deployed system is safe. If you need a production attestation, that is a separate engagement — and we will tell you so in writing.

## Who integrates this
Anyone who already has an agent runtime and is missing authorization semantics — platform/framework teams, security vendors extending into agent posture, cloud agent services needing recomputable compliance evidence. Integration is deliberately cheaper than evaluation.
