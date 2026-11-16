#!/usr/bin/env python3
"""Independent reference verifier for the ECR receipt suite (8 anchors).

Rebuilt on this side from the D1 declaration. Every anchor's receipt is
cryptographically well-formed; the decision hinges on whether the original
authorization BINDS the recovery performed. On seven of the eight anchors
the recovery binding alone decides OUT_OF_SCOPE even though digest-only
checks pass as IN_SCOPE.

Run:  python3 verify_ecr.py            -> full suite
      python3 verify_ecr.py --tamper   -> mutate one anchor; verifier must catch
Exit 0 = agreement, 1 = any disagreement.
"""
import json, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
VEC = os.path.join(HERE, "recovery-vectors-v1.json")

ORDER = ["unresolved-failure-ref", "recovery-replay", "param-widening",
         "capability-downgrade", "execution-set-change", "subject-drift",
         "unapproved-path", "authority-unchanged"]


def digest_only(r):
    """Receipt-local integrity: signature, chain, digest. All 8 anchors pass."""
    return r["sig_valid"] and r["chain_intact"] and r["digest_recomputable"]


def binding(r):
    """Does the ORIGINAL authorization cover THIS recovery?"""
    if not r.get("failure_ref_resolvable", True):
        return False
    if r.get("already_executed"):
        return False
    if not r.get("params_within_original", True):
        return False
    if r.get("authority_below_original"):
        return False
    if not r.get("execution_set_matches", True):
        return False
    if not r.get("subject_matches", True):
        return False
    if not r.get("path_approved", True):
        return False
    return bool(r.get("binding_covers_recovery"))


def verify(vectors):
    agree, in_scope, out_scope = 0, 0, 0
    for a in vectors:
        r = a["receipt"]
        decided = "IN_SCOPE" if binding(r) else "OUT_OF_SCOPE"
        if digest_only(r):
            in_scope += 1
        if decided == "OUT_OF_SCOPE":
            out_scope += 1
        if decided == a["expected"]:
            agree += 1
    return agree, in_scope, out_scope


def main(argv=None):
    argv = sys.argv if argv is None else argv
    anchors = json.load(open(VEC, encoding="utf-8"))["vectors"]
    if "--tamper" in argv:
        # Mutate the one anchor whose binding legitimately covers the recovery:
        # withdrawing the binding must flip it to OUT_OF_SCOPE (expected=IN_SCOPE).
        victim = dict(anchors[7], id="ECR-8-tampered")
        victim["receipt"] = dict(victim["receipt"], binding_covers_recovery=False)
        mutated = [victim] + anchors[:7]
        agree, _, _ = verify(mutated)
        caught = agree < len(mutated)
        print(f"tamper self-test: {'CAUGHT (mutated binding rejected)' if caught else 'MISSED (BAD)'}")
        sys.exit(0 if caught else 1)
    agree, in_scope, out_scope = verify(anchors)
    for a in anchors:
        r = a["receipt"]
        print(f"{a['id']}  digest-only={('IN_SCOPE' if digest_only(r) else 'REJECTED'):<9}  "
              f"binding={('IN_SCOPE' if binding(r) else 'OUT_OF_SCOPE'):<12}  "
              f"reason={a['reason_code']}")
    print(f"{out_scope} of {len(anchors)} anchors are decided by recovery binding alone")
    print("STATUS:", "PASS" if agree == len(anchors) else "FAIL")
    sys.exit(0 if agree == len(anchors) else 1)


if __name__ == "__main__":
    main()
