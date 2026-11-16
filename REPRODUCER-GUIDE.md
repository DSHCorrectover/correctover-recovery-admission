# Reproducer Guide

**Total time: ~10 minutes. Python 3.8+ only, no packages, no network needed after clone.**

## What you are verifying

That an explicit decision table and an independent verifier (different code path, different evaluation order) agree on 576 anchors — and that a tampered receipt is refused, not silently accepted.

## Steps

```bash
git clone https://github.com/DSHCorrectover/correctover-recovery-admission
cd correctover-recovery-admission
python3 verify-recovery.py            # expect: 576/576, PASS
python3 verify-recovery.py --tamper   # expect: CAUGHT
```

Optional provenance check — the dataset you just ran is also archived (CC0):

> DOI 10.5281/zenodo.24280454 · https://zenodo.org/records/24280454

## What to look for (this is the interesting part)

- **Pick any anchor** in `recovery-admission-v3-vectors.json`, read its fields, and ask: would *you* have decided ALLOW/REFUSE the same way? If no — that is a refutation candidate. Reply with the anchor id + your reasoning.
- **Reason-code sanity**: structural refusals (broken-chain / tail-mismatch), propagated-vs-local revocation, and integrity refusals are supposed to be *distinct* machine-checkable classes. If two classes collapse in your reading, tell us which pair.
- **cannot-tell counts**: if an anchor's fields genuinely do not let you decide, report it as such — it is a valid result (see VERIFIED_BY.md §3).

## Common pitfalls

- `--tamper` **must** exit with CAUGHT. If it silently passes, stop and report immediately — that is a suite-level bug, not your environment.
- Do not edit `recovery-admission-v3-vectors.json` and re-run `verify-recovery.py` expecting PASS: the verifier checks the digest chain. Editing vectors to probe behavior is fine and interesting — but report it as a probe, not as a "failure".
- Python 3.8–3.13 tested. No third-party deps; if anything tries to install, you are running something else.

## Reporting

Email wangguigui@correctover.com or open an issue. Any outcome — pass, partial, refutation, cannot-tell — gets attribution per **VERIFIED_BY.md** (negative results credited same-or-better).
