# Contributing

We actively want a second maintainer. This project's value is falsifiability, and falsifiability needs witnesses.

## What we need most (in order)
1. **Independent re-verifiers** — run the verifier against your own agent repos, open issues with vectors you disagree with. A disagreement with a published reason is more valuable than a green run.
2. **New action-class vectors** — the current decision table covers recovery-path actions (retry / degrade / failover / request-rewrite). We are standing up the second action class (delegation-chain actions). See ROADMAP-2026.md.
3. **Implementations in other languages** — the verifier semantics are deliberately simple; a Rust or Go re-implementation that reproduces the 576-anchor distribution would be a major trust asset.

## Ground rules
- Dataset: CC0. Code: Apache-2.0. No CLA, no copyright assignment.
- Every new anchor must carry: fixed input vector, expected verdict, reason code. Verdicts without reasons are rejected.
- If you find a number in this repo that cannot be recomputed from public sources, open an issue immediately. That bug class outranks all others.
