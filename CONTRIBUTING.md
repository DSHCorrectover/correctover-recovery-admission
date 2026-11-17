# Contributing

**The fastest useful contribution is a disagreement.** If you think one of the 576 anchor verdicts is wrong, open an issue with just: the anchor id + your reason. You do not need to run anything — arguing the reason code is enough, and a published disagreement with a reason is more valuable to this project than a green run.

## Changing a verdict — the bar
A verdict change requires: (1) the anchor id, (2) your stated reason, (3) a fixed input vector that reproduces the disagreement, (4) our written acceptance or a published refusal with our reason. Every accepted change lands with both sides visible — the issue stays open as the record.

## What we need most
1. **Independent re-verifiers** — run the verifier on repos we don't control; a red run on your repo tells us more than a hundred green ones.
2. **Reason-code disputes** — see above, zero setup required.
3. **Other-language implementations** — a Rust/Go re-implementation reproducing the 576-anchor distribution would be a major trust asset.

## Response commitment
Issues are read daily; expect a reply within 72h on business days — a weekend reply may come Monday.

## Ground rules
- Dataset: CC0. Code: Apache-2.0. No CLA, no copyright assignment.
- Every anchor carries: fixed input vector, expected verdict, reason code. Verdicts without reasons are rejected.
- If you find a number here that cannot be recomputed from public sources, open an issue immediately — that bug class outranks all others.
