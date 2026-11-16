# Correctover Recovery Admission

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.24280454-blue)](https://doi.org/10.5281/zenodo.24280454)

**Not a gateway — the authorization control plane for the seconds *after* the gateway says yes.** Every self-healing action (retry / degrade / failover / request-rewrite) passes a four-dimension admission decision *before* execution — identity, tool version, side effect, runtime state — and signs a tamper-evident receipt *after*.

Run it (10 seconds, no install beyond Python 3.8+):

```bash
python3 verify-recovery.py                # 576 vectors, independent checker, digest-only column
python3 verify-recovery.py --tamper       # negative self-test: mutated digest must be caught
```

Expected output: `agreement: 576/576 … STATUS: PASS`.

## What the suite proves

576 vectors, six orthogonal dimensions (nothing hand-tuned — the verdict distribution is a mathematical consequence of exhaustive cross-product):

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

`ESCALATE` fires only on *irreversible × (non-fresh or non-exact)* — the table itself locates the human gate; nobody weighted it there.

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

## License

Code: Apache-2.0 · Vector data: [CC0 1.0](DATA-LICENSE.md)

## Reproduction challenge

If you can refute any anchor — a verdict that is semantically wrong, a reason
code that mislabels reality — open an issue with the anchor id and your
reasoning. Verified refutations are credit-worthy: we will publish them in the
suite's changelog with your attribution. Independent reproduction reports are
welcome and will be linked from this README.
