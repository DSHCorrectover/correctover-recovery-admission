# Integration Surface — Agent Dispatch-Time Verdict Infrastructure

One page. Every claim below links to something independently verifiable.

> Repo hygiene: `main` is protected — every change lands via PR + required CI checks (including this file).

## What this company is

Correctover builds **dispatch-time verdict semantics for AI agents**: `(principal, scope, side_effect_class, freshness) → ALLOW / DENY / ESCALATE` with stable reason codes. The frozen decision table (576 anchors) is CC0 — vendorable, reimplementable, or adoptable as a standard reference. The commercial layer (MCP post-migration authorization-integrity attestation, USD 8k–15k/engagement) sits on top of the same table.

## Verifiable assets (all public, all replayable)

| Asset | Where | Verify |
|---|---|---|
| Decision table, 576 frozen anchors, reason codes | PyPI/npm `recovery-admission` 0.1.5 | `pip install recovery-admission` — vectors replay in seconds |
| 229,827-tool MCP census (13,054 zero-auth money-movers) | correctover-census.pages.dev/rankings | public rankings, frozen source snapshot |
| Session-as-Identity antinomy (protocol + CLI + radar) | github.com/DSHCorrectover/mcp-session-audit | reproducible ECS experiment set, CI-locked |
| Financial MCP Risk Baseline v0.2 (frozen) | Zenodo DOI 10.5281/zenodo.24072293 | versioned, citable |
| CrewAI actor-drift repro (A/B, one-variable) | `drift/repro.py` in this repo's history / DSHCorrectover | stdlib, exit 0, no frameworks |

## Where the interface gap is already on record (upstream threads, line-level evidence)

- **crewAIInc/crewAI#5802 / PR #5822** — guard key `tool+input` has no authorization dimension; `BaseTool.run(*args, **kwargs)` (base_tool.py:353) structurally cannot carry one
- **google/adk-python #6099** — upstream adopted our CCS framing, PR #8198 open (CLA pending)
- **PaloAltoNetworks/stock_advisory_assistant#1** — their own demo: irreversible buy/sell with construction-time-only authorization (their code, line refs)
- **PaloAltoNetworks/pan-mcp-relay#11** — verdict gate is two-valued over content; replay/actor/side-effect state has no slot
- **CrowdStrike/aidr-strands-python#3** — actor carried as telemetry, not verdict input
- **ServiceNow/ai-passport#6** — constraint checks (planned release): CC0 table offered as reference input
- **impartshadow/agent-contracts#3** — guard author's own repo, correction-then-harder-fact exchange on the record

## Independent verification

Konrad Gruszka (proofbundle author, first external CCS rev10 reader/erratum submitter) accepted an independent verification invitation 2026-11-16 — will run the 576-vector suite against his own Ed25519/RFC 8785/Merkle stack and publish results either way.

## Category fit (2026 consolidation themes: agent identities · model testing · runtime protection · permissions · model supply chain · autonomous-software security)

This table sits at **runtime protection × agent identities × permissions**. All figures above are public-anchor only.

