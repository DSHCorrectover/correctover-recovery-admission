# Changelog

## Independent verification

### 2026-11-17 — Xinghua Zhao (Steven Zhao), independent researcher, personal capacity · ORCID 0009-0001-0512-1237

- **Scope**: bounded semantic review of the six anchors the rule walkthrough left open (RA3-0013/0019/0021/0037/0043/0045), plus an independent full-suite execution.
- **Run (her machine, fresh clone @ `f5469041`)**: `verify-recovery.py` agreement **576/576**, `STATUS: PASS`; `--tamper` **CAUGHT**; digest-only column tampered→REFUSES **288/288**, intact→BINDS **288/288**; `args_digest` independently recomputed over JCS.
- **Findings**: 5 of 6 verdicts **not refuted**. 1 **refuted** (RA3-0019: an irreversible ALLOW sharing the reason code `clean` with readonly anchors — "a reader of the receipt cannot tell from `clean` that the action that ran was irreversible"). 1 **contested** (RA3-0037: failover ALLOW on patch drift while the irreversible class escalates — the table said both without saying which it means). Record gaps: failover rebind asserted without `rebind_target`/`rebind_authorization`; `ESCALATE` terminal for the table but not the world without a gate-block schema; the boolean `fresh` colliding with the `runtime` value `fresh`.
- **Disposition**: all findings accepted. F1 `fresh`→`sbsr_fresh`; F2 rebind fields added; F3a reason code `irreversible-authorized-exact-fresh`; F3b gate-block schema + verifier enforcement; RA3-0037 adjudicated to align with the irreversible class (failover × patch drift → `ESCALATE`/`human-gate-required`). Her full review: reviewer's copy; disposition commit referenced below.
- **Attribution scope per VERIFIED_BY.md**: attribution says the review was run and reported honestly; no endorsement implied by either side. Her review deliberately stayed separate from the arXiv v0.1 paper.

## Fixes

### 2026-11-17 — review-driven semantic fixes (F1–F3b + RA3-0037)

- **RA3-0019 (refuted, accepted)**: irreversible ALLOW reason `clean` → `irreversible-authorized-exact-fresh`. Reason distribution: `clean` now covers only readonly/state-write ALLOWs.
- **RA3-0037 (contested, adjudicated)**: failover is traffic-moving; fresh-but-patch-drift rebind now `ESCALATE`/`human-gate-required` (was `ALLOW`/`failover-sbsr-rebind`). Action distribution: ALLOW 15→14, ESCALATE 3→4. Failover targets are version-locked by policy; a non-version-locked target is a gate, not a pre-approval.
- **F1**: receipt boolean `fresh` → `sbsr_fresh` (the `runtime` dimension keeps the value `fresh`; one word, one predicate).
- **F2**: `failover-sbsr-rebind` ALLOW records now carry `rebind_target` + `rebind_authorization` (`approval_id`, `version_locked`).
- **F3b**: gate-block schema defined (`gate_id`, `gate_at`, `gate_decision`, `gate_evidence_digest`, `bound_args_digest`); verifier enforces completeness and re-binding when present (`gate-block-invalid`); positive + both negative cases tested.
- **Regression**: generator vs independent verifier 576/576 PASS; tamper CAUGHT; digest-only 288/288 + 288/288 unchanged.
