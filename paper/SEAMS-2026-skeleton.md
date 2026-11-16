# Fail-and-Recover, Not Fail-Closed: Recovery Admission for Self-Healing Agentic Systems

**SEAMS 2026 submission skeleton — v0.1 (2026-11-16). Status: sections marked [FILL] await data; all cited evidence exists and is independently re-runnable.**

- **Artifact**: DOI 10.5281/zenodo.24280454 (CC0 dataset) · code Apache-2.0 at github.com/DSHCorrectover/correctover-recovery-admission · two commands reproduce 576/576 + tamper CAUGHT in ~10s
- **Claim under test**: automated recovery actions in agentic systems are an un-governed authorization blind spot; a pre-execution admission decision + post-execution tamper-evident receipt closes it, and the semantics are falsifiable.

---

## 1. Introduction

Adaptive and self-managing systems have recovered automatically since MAPE-K. What has not changed is the governance position of the recovery itself: a workflow engine retries, a failover manager rebinds, an LLM agent rewrites and re-dispatches — and no component asks whether *this recovery action* is authorized. Gateway authorization covers the original request; the seconds after a failure, in which the agent acts autonomously under stress, are silent.

**Thesis.** Recovery is where an agent is most autonomous and least governed. We define *Recovery Admission*: a pre-execution authorization decision for every automated recovery action, made on four independent dimensions (delegated identity, tool-version drift, side-effect class, runtime state), with a tamper-evident receipt bound after execution. Fail-and-recover, not fail-closed: the system must be *allowed* to recover — under admission, not by absence of control.

**Contributions.**
1. A problem statement and four-dimension admission model for recovery actions, with two fixed delegation semantics (chain-track verdicts bind the chain tail with revocation propagation; no-chain-track local assertions cannot authorize state-mutating actions).
2. An 8-value RecoveryAction taxonomy and a machine-checkable decision table whose verdict distribution is *measured, not tuned*.
3. A 576-anchor falsifiable suite: six orthogonal dimensions, two independent implementations (decision table + verifier through different code paths and evaluation orders) at 576/576 agreement, with a tamper self-test that must be caught.
4. A methodology section (§6) that defines what counts as independent verification — including negative results (cannot-tell verdicts are findings, not failures).

## 2. Motivating scenario [FILL: one concrete incident, anonymized]

An agent fails on a tool call. Its harness retries — after a version drift, under a revoked intermediate principal, while the upstream is down, silently rewriting request fields to "make it work". Each of these is individually reasonable recovery engineering; together they are an un-governed action by a delegation-derived principal. [FILL: link a public post-mortem or the census rates from §3.]

## 3. Measurement background (related work in evidence form)

- 229,827 MCP tool parameters audited (census, sha256-pinned source): 13,054 zero-auth money-capable tools — the population over which recovery actions run. [FILL: citation block, census DOI + repo]
- 286-protocol vector series (chain semantic layer) + ESCALATE ladder (irreversible × non-fresh). [FILL: citation block]
- Related-work position: workflow-recovery engines / auto-remediation / SOAR recover but do not authorize the recovery; gateways authorize the original request but are silent after admission; policy engines (OPA etc.) authorize but do not bind recovery semantics or emit decision receipts. **No shipped system occupies the pre-execution authorization slot FOR recovery actions.** [FILL: comparison table, one row per candidate system, criterion = "who decides on the recovery?"]

## 4. Model

### 4.1 RecoveryAction taxonomy (8 values)
readonly · state-write · failover · irreversible — crossed with two execution modes (reversible-undoable / irreversible-entangling). [FILL: finalize the 8-cell naming under page constraint]

### 4.2 Four admission dimensions
1. **Identity** — delegation shape (valid / tail-mismatch / broken / none), tail binding, revocation with propagation semantics (revoked-intermediate ⇒ identity-revoked-propagated; local-only ⇒ identity-revoked-local).
2. **Tool version** — major-version drift refuses; patch compatible; irreversible requires exact match.
3. **Side effect** — permissiveness ladder readonly > state-write > failover > irreversible; failover requires fresh subject-binding re-signature; irreversible × non-fresh ⇒ ESCALATE / human-gate-required.
4. **Runtime state** — fresh / stale / upstream-down; upstream-down holds reversible actions with intent-hash preservation (no silent rewrite while upstream unavailable).

### 4.3 Two delegation tracks (the semantic fork)
- **Chain track**: verdict binds chain tail; revocation propagates down-chain.
- **No-chain track**: local assertions only; beyond readonly, fail-closed with a reason code distinct from chain-track revocation. This fork is what keeps the 576 suite from being a bigger 108 suite: chain and no-chain are semantically different populations, not volume padding.

### 4.4 Decision semantics (normative order)
Integrity first (tampered digest ⇒ every local assertion refuses), then delegation structure, then version, then the runtime × side-effect matrix. DOWNGRADE never widens scope. Failover-rebind requires fresh subject-binding. Request rewrites preserve intent hash. Learned rules enter a shadow ledger; never auto-execute.

## 5. The falsifiable suite

Six orthogonal dimensions: delegation(4) × revocation(2) × version(3) × side-effect(4) × runtime(3) × integrity(2) = **576 anchors**.

**Measured verdict distribution (not tuned):** ALLOW 15 · HOLD 6 · DOWNGRADE 2 · ESCALATE 3 · REFUSES 550. Reason classes split machine-checkably: structural (broken-chain 72, tail-mismatch 72), propagated vs local revocation (36/36), integrity (288), genuine policy refusals.

**Negative branch.** A digest-only pipeline (verify receipts without the four-dimension admission) — the honest model of "what a weaker pipeline would accept" — accepts 288 intact-digest anchors that full admission refuses. This is the paper's quantitative statement of the gap: the recovery-second blind spot is not theoretical.

## 6. Independent verification methodology (the position section)

What counts as independent verification, stated as normative rules:
1. **Reader classes carry different evidential weight** — producer re-run ≠ third-party reproduction ≠ adversarial refutation. Every claim carries its reader-class tag.
2. **A reproduction that uses the producer's corpus is simultaneously reproduction evidence and anti-independence evidence** — it validates executability, not correctness.
3. **cannot-tell is a finding**: an auditor unable to decide from the receipt chain is reported as a verdict, feeds the negative test corpus, and is never silently dropped.
4. **Producer-downgrading**: where our own implementation is the only reader, we say so in the artifact (precedent: the R13 entry self-flagged as producer-only reproduction). We would rather annotate our own weakness than have a reviewer discover it.

## 7. Evaluation plan [FILL: numbers, deadlines]

- **E1 576/576 agreement** — done, reproducible in ~10s (DOI record).
- **E2 adversarial reading** — invitations out (independent verifier-of-record process; archived precedent of a hostile reader catching a real verifier bug: the detached-signature finding that forced verifier v1.6.0). [FILL: outcome]
- **E3 digest-only gap re-measurement** — done (288-refusal gap), re-measured on every suite version.
- **E4 [stretch] one deployed harness emitting admission decisions + receipts** — the largest open gap; target: one real deployment reporting recovery-action admission counts and zero unauthorized-widening over [FILL window].

## 8. Threats to validity

- The decision table encodes *our* policy positions (e.g., failover-without-fresh subject-binding refuses). The suite makes positions falsifiable, not neutral; reviewers are invited to dispute anchor-level verdicts, and the changelog records disputes with attribution.
- Verifier-independence is code-path independence within our project; true third-party independence is exactly what the invitation process tests. Scope is stated in HONESTY.md.
- Recovery actions are enumerated (8 values); exotic recoveries (e.g., agent-spawned subagent as "recovery") are out of scope and flagged.

## 9. Conclusion

The recovery second is where agentic autonomy is highest and governance is absent. We mapped the slot, fixed the semantics, and published a suite that can be refuted in ten seconds. **The map of this slot is ours; the refutations are yours.**

## Artifact appendix
- Dataset (CC0): DOI 10.5281/zenodo.24280454 — vectors, decision table, independent verifier, measured report (4 files, API-verified).
- Code (Apache-2.0): github.com/DSHCorrectover/correctover-recovery-admission
- Reproduction: `python3 verify-recovery.py` (576/576 PASS) · `python3 verify-recovery.py --tamper` (CAUGHT)
- Honesty statement: HONESTY.md (in repo).

## Submission checklist
- [ ] §2 motivating incident (find public post-mortem or use census rates)
- [ ] §3 comparison table
- [ ] E2 outcome (or drop to "in progress" per honest-reporting rule)
- [ ] E4: attempt one deployment; if zero, the paper says zero — per the cannot-tell rule
- [ ] Page-limit pass; authors line (disclose AI-assisted drafting per venue policy)
