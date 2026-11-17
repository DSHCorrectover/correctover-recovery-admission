# Correctover Recovery Admission

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.24280454-blue)](https://doi.org/10.5281/zenodo.24280454)

**We determine whether an agent's action exceeds the authorization it was actually granted — parameter by parameter, not tool by tool.** A tool whitelist proves a client *can* call an approved tool; it does not prove every parameter and target of that call was approved. Isolation-legal API calls to the wrong server are still unacceptable. Recovery paths (retry / degrade / failover / request-rewrite) are where this failure class concentrates, so this suite ships 576 anchors for them — but the decision table judges any action class the same way: four dimensions (identity, tool version, side effect, runtime state) *before* execution, a tamper-evident receipt *after*.


**Scope keywords:** agent authorization · delegated authorization · RFC 8693
token exchange · act/may_act delegation chains · CI security gate ·
attestation receipt · parameter-level authorization.

Run it (10 seconds, no install beyond Python 3.8+):

```bash
python3 verify-recovery.py                # 576 vectors, independent checker, digest-only column
python3 verify-recovery.py --tamper       # negative self-test: mutated digest must be caught
```

Expected output: `agreement: 576/576 … STATUS: PASS`.

## What the suite proves

576 vectors, six orthogonal dimensions (nothing hand-tuned — the verdict distribution is a mathematical consequence of exhaustive cross-product)

**Maintenance status:** issues are read daily; expect a reply within 72h.

> The six dimensions are **our decomposition, not a discovered constant** — the cross-product is exhaustive within them. Disagree with a dimension, and the verdicts downstream of it change. That's the part worth arguing with us about.:

| Dimension | Values |
|---|---|
| delegation shape | chained-valid · tail-mismatch · broken-chain · none-direct |
| revocation | none · revoked (propagates down the chain on the chain track; binds only locally on the no-chain track) |
| tool version | exact · patch · major |
| side effect | readonly · state-write · failover · irreversible |
| runtime | fresh · stale · upstream-down |
| integrity | intact · tampered-digest |

Two tracks with **fixed semantics**:

- **Chain track** (delegated, org→a→b): the verdict binds the chain tail; revocation of a mid-chain principal propagates to the tail (`identity-revoked-propagated`). A structurally broken chain or tail mismatch refuses *everything*, readonly included.
- **No-chain track** (direct grant): the verdict can only bind local assertions → fail-closed for anything but readonly (`no-chain-cannot-bind-state-action`); local revocation has no chain to propagate (`identity-revoked-local` — a distinct reason code, not the same bucket).

`ESCALATE` fires on *irreversible × (non-fresh or non-exact)* **and** on *failover × fresh-but-patch-drift* — a rebind is traffic-moving; routing traffic through an unapproved build gets the same human gate as an irreversible action (RA3-0037 adjudication, Xinghua Zhao review 2026-11-17). The table itself locates the human gate; nobody weighted it there.

Reason-code honesty: `clean` is reserved for readonly/state-write ALLOWs; an irreversible ALLOW carries its own code (`irreversible-authorized-exact-fresh`) so a receipt reader never has to guess which class passed.

Receipt fields that carry their assertions:

- A `failover-sbsr-rebind` ALLOW asserts a rebind — the record carries `rebind_target` and `rebind_authorization` (approval id + `version_locked`). Failover targets are **version-locked** to the approved build; a target that is not version-locked is not pre-approved, it is a gate.
- The boolean `sbsr_fresh` is the receipt/SBSR credential freshness and is deliberately independent of the `runtime` dimension (`upstream-down` keeps `sbsr_fresh=True`). One word, one predicate.
- An `ESCALATE` verdict is terminal for the *table*, not for the *world*: if the escalated action later proceeds, the record must carry a gate block — `gate_id`, `gate_at`, `gate_decision`, `gate_evidence_digest`, `bound_args_digest` (the last must re-bind the exact dispatched args). The verifier rejects a record whose gate block is incomplete or unbound (`gate-block-invalid`).

The `digest-only` column is the falsifiability anchor: a pipeline that only checks receipt digests BINDS all 288 intact anchors and REFUSES all 288 tampered ones — the negative branch is live and measured, not assumed.

## Repo map

- `verify-recovery.py` — independent verifier (different code path & evaluation order from the decision table; any disagreement = FAIL)
- `recovery-admission-v3-vectors.json` — the 576 anchors with expected verdict + reason class
- `report/recovery-admission-report.json` — latest run: agreement, action & reason distributions, digest-only discrimination
- `HONESTY.md` — what is a proxy metric, what is an environment caveat

## Honest boundaries

- Scope-drift statistics derived elsewhere use a **verb-heuristic proxy** (dangerous verbs in tool descriptions not reflected in tool names) — it is a signal, not ground truth.
- Endpoint-liveness figures were measured **from a sandboxed egress**; treat reachable percentages as lower bounds.
- This suite proves the admission *decision semantics*, not a deployed production system.


## Use as a GitHub Action

Add the free tier to any workflow — one step, no install:

```yaml
- uses: DSHCorrectover/correctover-recovery-admission@v0.1.0
```

Supply-chain locked (pin the commit SHA — what enterprises with CI security
gates usually require):

```yaml
- uses: DSHCorrectover/correctover-recovery-admission@c2eaf3b
```

What you get: a single-run verdict (PASS / MISMATCH) over the 576-anchor
decision table, run against the **published** PyPI artifact (never a
checkout), with a JSON report artifact and a step summary.

### Tiers

| | Free | Paid (planned) |
|---|---|---|
| Single-run verdict + report | ✓ | ✓ |
| Signed receipt (Ed25519, independently verifiable) | — | ✓ |
| Long-term archive + timestamps | — | ✓ |
| Recompute bundle for your auditor | — | ✓ |
| Continuous watch on dependency upgrades | — | ✓ |

The difference between the tiers is not features — it is **whether the
output is something you can hand to an auditor**. The free tier answers the
question; the paid tier is the answer with evidence that survives review.

Licensing note: dataset CC0, code Apache-2.0. Nothing here requires you to
trust us — every claim in this repo is replayable from your own machine.

## License

Code: Apache-2.0 · Vector data: [CC0 1.0](DATA-LICENSE.md)

## Reproduction challenge

If you can refute any anchor — a verdict that is semantically wrong, a reason
code that mislabels reality — open an issue with the anchor id and your
reasoning. Verified refutations are credit-worthy: we will publish them in the
suite's changelog with your attribution. Independent reproduction reports are
welcome and will be linked from this README.
