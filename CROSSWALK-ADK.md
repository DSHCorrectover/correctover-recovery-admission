# CROSSWALK-ADK.md — RA 576 suite × google/adk-python (v1.1, 2026-11-17)

**Anchor verdict scope: `per-tool-call`** (applies to every anchor in the 576-vector suite; N calls in one model response → N independent receipts).
**Status**: v1.1 · **Maintainer**: Correctover (DSHCorrectover)
**Origin**: proposed in [google/adk-python#6099](https://github.com/google/adk-python/issues/6099) (2026-11-17). This is a community proposal for discussion — no claim that ADK has reviewed, adopted, or run it.
**Change log v1.0 → v1.1**: ① every anchor's verdict scope declared **per tool call, not per turn** (accepted from @renezander030's note; consistent with @tonydzi's sibling-call repro); ② framework-field mapping corrected against ADK master source — four dimensions marked GAP/cannot-tell instead of assumed-exposed.

## 1. Verdict scope: per tool call

One model response with N tool calls yields N independent receipts. A refusal on one call implies nothing about its siblings. `turn_verdict` is not a single value.

PoC (stdlib-only, offline): one response, two sibling calls — A revoked identity + state-write → `REFUSES (identity-revoked-propagated)`; B clean readonly on the same resource → `BINDS (clean)`. Same turn, different verdicts. See the 2026-11-17 12:09Z comment on #6099.

ADK anchors this granularity natively: `Context.function_call_id` exists per tool call (`src/google/adk/agents/context.py`; `ToolContext` = `Context` re-exported by `src/google/adk/tools/tool_context.py`).

## 2. Field mapping — corrected against ADK master (checked 2026-11-17)

Dual independent source reads converge:

| RA dimension | ADK field today | Verdict | Sources |
|---|---|---|---|
| per-call identity | `Context.function_call_id` (context.py) | **exposed** | DSHCorrectover read of context.py/tool_context.py; PHM-Audit read of llm_request.py (both 2026-11-17) |
| tool-level confirmation | `Context.tool_confirmation` / `request_confirmation` | **exposed** | DSHCorrectover (context.py) |
| tool credential binding | auth handlers on `Context` (`AuthCredential`/`AuthConfig`, tool_context.py lazy exports) | **exposed** | DSHCorrectover (tool_context.py) |
| delegation chain (capability/permission delegation) | only agent-transfer `mode` (llm_agent.py:409: chat/task/single_turn) — not a permission chain | **GAP — cannot-tell** | DSHCorrectover (context.py/llm_agent.py) + PHM-Audit (llm_request.py): converge |
| revocation state | no such field | **GAP — cannot-tell** | both reads converge |
| tool version baseline | `tools_dict` carries name→tool only; `version` appears only as artifact version (context.py) | **GAP — cannot-tell** | both reads converge |
| upstream freshness | no freshness/staleness concept at dispatch | **GAP — cannot-tell** | both reads converge |

**Reading rule**: for an ADK deployment, anchors whose RA derivation requires a GAP dimension are reported **cannot-tell** for that anchor, never pass/fail — unless the deployment supplies the field itself (e.g. via `Context.state`, an auth plugin, or a wrapper carrying version/revocation metadata). cannot-tell is published with the same weight as pass/fail.

## 3. Attribution record

- Proposal, the 576-vector suite, the 288/288 measurements, PR #8198: **DSHCorrectover** — independently un-reproduced; the stdlib verifier is idempotent and any differing run output is treated as an erratum and published.
- The two corrections (per-call scope; field-mapping strictness): **@renezander030**.
- Independent source verification: **@PHM-Audit** (llm_request.py) + DSHCorrectover (context.py/tool_context.py), converging verdicts.
- Full thread context: [#6099](https://github.com/google/adk-python/issues/6099).

## 4. Relationship to CROSSWALK-ECR-RA.md

Unchanged: ECR (8 reason codes, execution side) and RA (576 anchors, verification side) are orthogonal axes. This document only maps RA anchor *judgeability* inside ADK as-shipped; it does not alter the ECR↔RA contract.
