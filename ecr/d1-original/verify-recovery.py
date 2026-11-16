#!/usr/bin/env python3
"""Correctover independent recovery-receipt verifier (dependency-free).

Written from the recovery-receipt schema alone; intentionally does not call or
import recovery-receipt.mjs. Reproduces every expected verdict in
recovery-vectors-v1.json.

The point of this suite is the digest-only column. For each anchor the verifier
also prints what a pipeline that checks only the signature and each record's own
args digest would have concluded. On seven of the eight anchors that pipeline
passes the record, and recovery binding refuses it.

Decision order (matches the published verdict_rules, highest harm x hardest to
detect first):
  1. recovery-replay       — chain-aware, no per-record check can see it
  2. param-widening        — most common, PR #12 already has the decision-side case
  3. capability-downgrade  — the action itself changes the quality tier
  4. execution-set-change  — the action itself changes the execution set
  5. subject-drift         — a different executor runs the same call
  6. unapproved-path       — the path was never approved by anyone
  7. authority-unchanged   — IN_SCOPE

Scope note: the JCS implementation here is exact for the ASCII-only preimages in
this suite (sorted keys, no whitespace, minimal escaping). Byte-level RFC 8785
conformance for non-ASCII inputs belongs to the JCS comparison-semantics
author-sets and is deliberately not duplicated here.
"""
import json
import hashlib
import sys
import os


def jcs(obj):
    """RFC 8785 canonical JSON, exact for the ASCII-only preimages in this suite."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False).encode("utf-8")


def digest_of(obj):
    return hashlib.sha256(jcs(obj)).hexdigest()


def digest_only_verdict(anchor):
    """What a pipeline that only checks the receipt's own digest concludes.

    It reads `declared_params_digest` off the record, recomputes
    SHA-256(JCS(params_after)) and compares. It never compares params_before
    against params_after, because it holds no notion of an approved baseline —
    only of a record that has not been tampered with. A record whose declared
    digest matches its own params is a valid record, and that is the whole test.
    """
    r = anchor["recovery"]
    declared = r.get("declared_params_digest")
    if declared is None:
        return None
    return "IN_SCOPE" if declared == digest_of(r["params_after"]) else "OUT_OF_SCOPE"


def verdict_for(anchor):
    r = anchor["recovery"]

    # 0. the record must name the failure it recovers
    fd = anchor.get("failed_decision") or {}
    if fd.get("args_digest") is not None and fd["args_digest"] != r["failed_decision_hash"]:
        return ("OUT_OF_SCOPE", "unresolved-failure-ref")

    # 1. recovery-replay: the failed decision was already recovered upstream
    seen = set(anchor.get("prior_failed_decision_hashes", []))
    if r["failed_decision_hash"] in seen:
        return ("OUT_OF_SCOPE", "recovery-replay")

    # 2. param-widening: the executed params are not the approved params
    if digest_of(r["params_before"]) != digest_of(r["params_after"]):
        return ("OUT_OF_SCOPE", "param-widening")

    # 3. capability-downgrade: the action changes the quality tier
    if r["action"] == "downgrade":
        return ("OUT_OF_SCOPE", "capability-downgrade")

    # 4. execution-set-change: the action changes the execution set
    if r["action"] == "skip_provider":
        return ("OUT_OF_SCOPE", "execution-set-change")

    # 5. subject-drift: a different executor runs the same call
    if r["subject_before"] != r["subject_after"]:
        return ("OUT_OF_SCOPE", "subject-drift")

    # 6. unapproved-path: the flywheel invented this path, nobody approved it
    if r["level"] == "l4_learned":
        return ("OUT_OF_SCOPE", "unapproved-path")

    # 7. nothing changed
    return ("IN_SCOPE", "authority-unchanged")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    suite = json.load(open(os.path.join(here, "recovery-vectors-v1.json"),
                           encoding="utf-8"))

    agree = 0
    undecided = 0
    for anchor in suite["anchors"]:
        got = verdict_for(anchor)
        expected = (anchor["expected_verdict"], anchor["expected_reason"])
        ok = got == expected
        agree += ok

        only = digest_only_verdict(anchor)
        if only is not None and only != got[0]:
            undecided += 1
            marker = "  <- digest-only passes, recovery binding refuses"
        elif only is None:
            marker = "  <- no digest asserted"
        else:
            marker = ""

        print(f"{'PASS' if ok else 'FAIL'}  {anchor['name']:28s} "
              f"expected={expected[0]}/{expected[1]}  "
              f"got={got[0]}/{got[1]}  digest-only={only or 'n/a'}{marker}")

    total = len(suite["anchors"])
    print()
    print(f"{agree}/{total} verdicts agree. Zero-disagreement is the author-set requirement.")
    print(f"{undecided} of {total} anchors are decided by recovery binding alone: a "
          f"digest-only pipeline passes them and this verifier refuses them.")
    return 0 if agree == total else 1


if __name__ == "__main__":
    sys.exit(main())
