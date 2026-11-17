# Correctover — one-pager for forwardable intros

**Correctover is agent compliance evidence infrastructure.** We produce forensic-register assessments of agent/LLM tool-call actions — "did the authorization binding survive?" — each delivered with an independently replayable evidence dossier.

**Position, in one line:** migration and monitoring vendors prove the handshake works. We certify what happens *after* the handshake — binding integrity, at the action layer.

## Why now (two regulatory clocks, stated separately)

- **SEP-2596 / MCP stateless enforcement** (2026-07-28): the session layer that implicitly carried auth context is being removed; earliest removal of the deprecated lane is 2027-07-28 or later, at Core Maintainers' discretion. Every migration in that window ends where the audit question begins.
- **EU AI Act obligations** (Digital Omnibus text): high-risk system obligations land **2027-12-02** under the omnibus schedule. Evidence needs are documented, not assumed.

(We state these as two separate timelines from two separate legal sources; we do not sell them as a combined "double window".)

## What is verifiable today (adoption evidence)

- 576-entry verdict table for re-authorization decisions — 8 reason classes, structural blind spots documented *including our own engine's*, each row replayable from public CI runs (green and red, both public)
- Public sample assessment of our own legacy target: [ecr-arena/samples/first-report.md](https://github.com/DSHCorrectover/ecr-arena/blob/main/samples/first-report.md)
- One-page index of every verifiable asset, merged through branch-protected CI: [INTEGRATION-SURFACE.md](https://github.com/DSHCorrectover/correctover-recovery-admission/blob/main/INTEGRATION-SURFACE.md)
- Methodology published as an IETF individual draft (draft-correctover-ccs rev10); the same verdict shape is under human review inside google/adk-python (#8198)
- Verifier on PyPI (ELv2), MIT-licensed checker, CC0 vector data — buyers can re-verify offline without trusting us

## What is NOT yet proven (revenue evidence)

We separate the two on purpose. Adoption evidence above is real and checkable. **Named-enterprise revenue evidence: zero.** We do not present the former as the latter. Current delivery target: post-migration auth integrity assessment as a compliance/audit line item; pricing on request, per engagement.

## Who we're useful to, immediately

- **MCP migration vendors** — an independent post-migration assessment makes their delivery complete; referral or bundle, no exclusivity
- **GRC platforms** — verdict reports + evidence dossiers land as checkable compliance artifacts (documents/file uploads; standard resource types, no custom resources needed for the Vanta shape)
- **Auditors assessing agent systems** — forensic register, replay commands in the dossier, written to be handed over, not paraphrased

## Contact

Guigui Wang — wangguigui@correctover.com · github.com/DSHCorrectover

*AI-assisted disclosure: this document was drafted with AI assistance and reviewed by Guigui Wang.*
