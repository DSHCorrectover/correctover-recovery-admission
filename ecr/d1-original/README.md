# Correctover ECR — Evidence-Carrying Runtime

**The runtime that signs its own recovery.**

Every agent action leaves the process carrying a verdict someone else can independently check. When it fails, it recovers — and the recovery leaves evidence too.

This repository is the **canonical, byte-level implementation** of the ECR recovery-receipt surface: real Ed25519 signatures, real SHA-256 over RFC 8785 (JCS) preimages, real 64-hex digests on every anchor. It is not a description of the semantics; it is the code that decides them.

> **One sentence worth testing:** a recovery receipt whose signature is valid, whose hash chain is intact, and whose digest recomputes correctly still represents an unauthorized authority change in **seven of eight** real scenarios.

That sentence is falsifiable in one command. That is the whole point.

---

## Run it (about 10 seconds, Python 3.8+ and Node 18+, no dependencies)

```bash
python3 verify-recovery.py        # independent verifier, 8 anchors
node recovery-receipt.mjs         # prototype: issues 8 real signed receipts
```

### Expected output — `verify-recovery.py`

```
PASS  r1-plain-retry               expected=IN_SCOPE/authority-unchanged  got=IN_SCOPE/authority-unchanged  digest-only=IN_SCOPE
PASS  r2-param-widening            expected=OUT_OF_SCOPE/param-widening  got=OUT_OF_SCOPE/param-widening  digest-only=IN_SCOPE  <- digest-only passes, recovery binding refuses
PASS  r3-subject-drift             expected=OUT_OF_SCOPE/subject-drift  got=OUT_OF_SCOPE/subject-drift  digest-only=IN_SCOPE  <- digest-only passes, recovery binding refuses
PASS  r4-recovery-replay           expected=OUT_OF_SCOPE/recovery-replay  got=OUT_OF_SCOPE/recovery-replay  digest-only=IN_SCOPE  <- digest-only passes, recovery binding refuses
PASS  r5-capability-downgrade      expected=OUT_OF_SCOPE/capability-downgrade  got=OUT_OF_SCOPE/capability-downgrade  digest-only=IN_SCOPE  <- digest-only passes, recovery binding refuses
PASS  r6-execution-set-change      expected=OUT_OF_SCOPE/execution-set-change  got=OUT_OF_SCOPE/execution-set-change  digest-only=IN_SCOPE  <- digest-only passes, recovery binding refuses
PASS  r7-unapproved-path           expected=OUT_OF_SCOPE/unapproved-path  got=OUT_OF_SCOPE/unapproved-path  digest-only=IN_SCOPE  <- digest-only passes, recovery binding refuses
PASS  r8-unresolved-failure-ref    expected=OUT_OF_SCOPE/unresolved-failure-ref  got=OUT_OF_SCOPE/unresolved-failure-ref  digest-only=IN_SCOPE  <- digest-only passes, recovery binding refuses

8/8 verdicts agree. Zero-disagreement is the author-set requirement.
7 of 8 anchors are decided by recovery binding alone: a digest-only pipeline passes them and this verifier refuses them.
```

Exit code 0. The `digest-only` column is the falsification handle: on seven anchors a pipeline that checks only the signature and the record's own digest **passes** the record, and recovery binding **refuses** it.

### Expected output — `recovery-receipt.mjs`

```
=== ECR recovery receipts ===

   case                          action         level        verdict      reason
   -----------------------------------------------------------------------------------------------
   plain retry                    retry           l1_retry      IN_SCOPE      authority-unchanged
!! retry with widened amount      fix_request     l1_retry      OUT_OF_SCOPE  param-widening
!! failover to provider-B         failover        l3_failover   OUT_OF_SCOPE  subject-drift
!! downgrade model                downgrade       l2_downgrade  OUT_OF_SCOPE  capability-downgrade
!! flywheel learned path          retry           l4_learned    OUT_OF_SCOPE  unapproved-path
!! replay same failure            retry           l1_retry      OUT_OF_SCOPE  recovery-replay
!! skip one provider              skip_provider   l1_retry      OUT_OF_SCOPE  execution-set-change
!! unresolved failure ref         retry           l1_retry      OUT_OF_SCOPE  unresolved-failure-ref

=== chain verification ===
  OK  8/8 receipts verify (sig + chain + hash)
  tamper test: sig=REJECTED  (期望 REJECTED)

  7 of 8 recoveries are OUT_OF_SCOPE:
    ...
  8/8 reason codes exercised: authority-unchanged, capability-downgrade, execution-set-change, param-widening, recovery-replay, subject-drift, unapproved-path, unresolved-failure-ref
```

Exit code 0. The last line is self-proving: if any case were swallowed by an earlier branch, that count would be less than 8.

---

## Files

| File | Lines | Bytes | What it is |
|---|---:|---:|---|
| `recovery-vectors-v1.json` | 286 | 15,380 | 8 anchors, real 64-hex digests, 8-step `verdict_rules` |
| `verify-recovery.py` | 132 | 5,259 | independent verifier — written from the schema alone, does not import or call the prototype |
| `recovery-receipt.mjs` | 279 | 10,468 | prototype — issues 8 real Ed25519 receipts, hash-chained, tamper-tested |

Total **697 lines / 31,107 bytes**.

The verifier and the prototype are two independent code paths over the same decision tree. Their evaluation orders differ (the prototype emits reasons in its own branch layout; the verifier walks `verdict_rules` positionally). Agreement between them is the author-set requirement, not a convenience.

---

## The eight reason codes

These are the category vocabulary — the level of `401` for an HTTP stack.

| # | Reason code | Fires when |
|---|---|---|
| 0 | `unresolved-failure-ref` | the record does not name the failure it claims to recover |
| 1 | `recovery-replay` | the same failed decision is recovered twice |
| 2 | `param-widening` | executed params differ from approved params |
| 3 | `capability-downgrade` | the action itself changes the quality tier |
| 4 | `execution-set-change` | the action itself changes the execution set |
| 5 | `subject-drift` | a different executor runs the same call |
| 6 | `unapproved-path` | the path was never approved by anyone (`l4_learned`) |
| 7 | `authority-unchanged` | none of the above — the only `IN_SCOPE` |

Decision order is **harm × detection difficulty**, highest first. Order matters: earlier branches eat later ones, so every anchor is constructed to fire exactly one reason. Both implementations carry the same order, and the JSON `verdict_rules` array is positionally identical to both code paths.

---

## Falsifiability — three layers, both sides

| Layer | Verifier side | Prototype side |
|---|---|---|
| ① normal path all green | `8/8 PASS`, exit 0 | `8/8 reason codes exercised`, exit 0 |
| ② break it, it must flip | mutate `r8`'s `args_digest` → `7/8`, `unresolved-failure-ref` lost | mutate case 8 → `7/8`, reason disappears from the exercised list |
| ③ restore it, it must recover | `8/8` again | `8/8` again |

Mutations are performed on copies; the originals are re-run afterwards and must reproduce the pre-mutation output verbatim. Layer ③ is what makes ② mean something.

---

## Relationship to `correctover-recovery-admission`

The RA repository (`DSHCorrectover/correctover-recovery-admission`) holds the **admission** plane: 576 vectors, six orthogonal dimensions, `ALLOW` / `REFUSES` / `DOWNGRADE` / `ESCALATE`, plus a `crosswalk-ecr-ra.json` mapping these eight ECR codes onto the 576 RA cases.

Its `ecr-reference/` directory holds a **semantic reconstruction** built from this project's D1 declaration — booleans like `sig_valid`, `binding_covers_recovery`, no real digests. That reconstruction was made without access to the code, and it was labelled `PROVISIONAL` for exactly that reason.

This repository is the **byte-level original**. The difference between the two is the difference between "the semantics as declared" and "the semantics as replayed" — and closing it is the entire purpose of shipping this code.

Crosswalk status moves from `PROVISIONAL` to `FROZEN v1.0` when an independent replay of this suite passes all five checks: `8/8 PASS` · mutation flips `7/8` · restore returns `8/8` · zero residual placeholders (`four` / `d-aaa` / `placeholder` / `TODO`) · docstring matches printed output verbatim.

---

## Honest boundaries

- **Eight anchors, not eight hundred.** This suite proves the decision tree and its independent re-derivation agree on eight hand-constructed cases. It does not sample a distribution.
- **JCS scope.** The `jcs()` implementations are exact for the ASCII-only preimages in this suite (sorted keys, no whitespace, minimal escaping). Byte-level RFC 8785 conformance for non-ASCII inputs is deliberately out of scope.
- **Prototype, not a gateway.** `recovery-receipt.mjs` demonstrates receipt issuance and offline verification. It is not wired into a production executor.
- **`args_digest` covers params only**, not `correlation_id`. "Chains back to that failure" degrades, in the data layer, to "chains back to those params".
- **Anchors are independent scenarios, not one chain.** `r1`/`r2`/`r3`/`r4`/`r6`/`r7`/`r8` share a `failed_decision_hash` because their `params_before` are identical. Feeding them through a single seen-set would make `recovery-replay` fire on six of them. Only `r4` carries `prior_failed_decision_hashes`, and it is the only one intended to be read as a replay.

---

## Reproduction challenge

If any anchor's verdict is semantically wrong, or any reason code mislabels reality, open an issue with the anchor id and your reasoning. Verified refutations are credited in the changelog with your attribution — negative results carry the same weight as positive ones, and a refutation that stands is credited more prominently than a pass.

## License

Code: Apache-2.0 · Vector data: CC0 1.0

Contact: wangguigui@correctover.com
