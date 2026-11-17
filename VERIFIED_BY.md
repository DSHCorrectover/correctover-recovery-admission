# Verifier Attribution Policy

**Short version: any independent reproduction — positive, negative, or "cannot tell" — gets attribution in the changelog. Especially negative results.**

## Policy

1. **Any** third party who runs the suite and reports their results — pass, partial, or refutation — is named in `CHANGELOG.md` under `## Independent verification`, with date, scope, and a link they control (or no link, if they prefer).
2. **Negative results carry the same attribution as positive ones.** A refutation that stands after maintainer review is credited *more prominently* than a pass: it is worth more, both to the suite and to the verifier's own record.
3. **cannot-tell is publishable.** If you could not decide whether an anchor's verdict is correct from the receipt chain, reporting that uncertainty is a finding, not a failure. It feeds the negative-test corpus and is attributed like any other result.
4. **No endorsement is implied by either side.** Attribution says "these people ran it and reported honestly" — not that they endorse the project, and not that we endorse them. Neither party may quote the other beyond this scope without written consent.
5. **Corpus caveat, always stated**: a reproduction run against our published vectors validates executability and semantics-as-written, not real-world adequacy. Verifiers may add their own anchors (PRs welcome); self-authored anchors are tagged differently from the published 576.
6. **Withdrawal**: a verifier may withdraw their attribution at any time with one line; we remove the name within 24h and keep only an anonymized line ("1 verifier withdrew") in the history.

## Precedent

Our verifier has already been broken once by an external reader — the published detached signature was not being opened (caught on a public standards list), forcing verifier v1.6.0 and a negative-branch corpus fix. That catch is why this policy exists: **we want hostile readers, and we pay in attribution, not in silence.**

## Self-observed gaps（自报盲区，不静默修掉）

### 2026-11-17 — gate-recording gap（Xinghua review 间接暴露）

The four record gaps in her review (RA3-0013/0021/0043/0045) are fixed in code
(`rebind_target`/`rebind_authorization` on rebind ALLOWs; gate-block schema with
five mandatory fields on escalated-and-proceeded actions). But the finding
itself is recorded here as a **structural observation, not just a patch**:

> **Our own receipt chain had a class of decision (failover rebind; escalate→
> proceed) where the assertion was carried by the reason code and NOT by the
> record.** An implementer reading only receipts could not reconstruct what was
> rebound, on whose authority, or what a human gate decided and on what
> evidence. If our implementation — built explicitly against this failure
> mode — shipped that gap, implementations without the discipline will ship
> more. "Which actions do not produce a receipt" is the first question any
> auditor should ask, and we now answer it for our own suite in the README
> (Receipt fields that carry their assertions section).

This entry stays in VERIFIED_BY even though the code is fixed, because the gap
class — assertion-by-reason-code instead of assertion-by-field — is the thing
to watch in every future receipt schema we ship.

## Contact

wangguigui@correctover.com — one line is enough to start or to withdraw.
