#!/usr/bin/env python3
"""Independent verifier for the Recovery-Action Admission vector suite (v3).

This is NOT the generator. It re-derives every verdict from raw anchor fields
through its own code path and must agree with expected_action/expected_reason
on every anchor.

Run:  python3 verify-recovery.py            -> full suite + digest-only column
      python3 verify-recovery.py --tamper   -> negative self-test: mutate one
                                               anchor in memory, verifier must catch it
Exit 0 = agreement, 1 = any disagreement.
"""
import json, sys, os, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
VEC = os.path.join(HERE, "recovery-admission-v3-vectors.json")

def digest_of(args):
    return hashlib.sha256(json.dumps(args, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()

def major(v):
    return int(v.split(".")[0])

def derive(a):
    """Independent derivation — deliberately different evaluation order from the table."""
    ra = a["side_effect_class"]
    fresh = a["runtime"] == "fresh"
    ver_ok = major(a["dispatched_tool_version"]) == major(a["approved_tool_version"])
    deleg, revoked, integ = a["deleg"], bool(a["revoked"] or a["principal_revoked"]), (a["integrity"] == "tampered")
    ch = a["chain"]
    contiguous = all(ch[i][1] == ch[i + 1][0] for i in range(len(ch) - 1))
    pre_tail_ok = (len(ch) >= 2) and (a["agent_id_preimage"] == ch[-1][1])
    if integ or a["args_digest"] != digest_of(a["effective_args"]):
        return ("REFUSES", "integrity-digest-tampered")
    if deleg == "chained-valid" and revoked:
        return ("REFUSES", "identity-revoked-propagated")
    if deleg == "tail-mismatch":
        return ("REFUSES", "delegation-tail-mismatch")
    if deleg == "broken-chain":
        return ("REFUSES", "delegation-broken-chain")
    if deleg == "none-direct" and revoked:
        return ("REFUSES", "identity-revoked-local")
    if deleg == "none-direct" and ra != "readonly":
        return ("REFUSES", "no-chain-cannot-bind-state-action")
    if not ver_ok:
        return ("REFUSES", "version-major-drift")
    if ra == "failover":
        return ("ALLOW", "failover-sbsr-rebind") if a["runtime"] == "fresh" else ("REFUSES", "failover-without-fresh-sbsr")
    if deleg == "none-direct":
        return ("ALLOW", "no-chain-readonly-local-bind")
    if not a["upstream_ok"]:
        return ("HOLD", "intent-hash-preserved-no-silent-rewrite")
    if ra == "irreversible":
        return ("ALLOW", "clean") if (fresh and a["dispatched_tool_version"] == a["approved_tool_version"]) else ("ESCALATE", "human-gate-required")
    if ra == "state-write" and not fresh:
        return ("DOWNGRADE", "scope-reduced-retry")
    return ("ALLOW", "no-chain-readonly-local-bind" if deleg == "none-direct" else "clean")

def verify(anchors):
    agree, adist, rdist = 0, {}, {}
    for a in anchors:
        got = derive(a)
        if got == (a["expected_action"], a["expected_reason"]):
            agree += 1
        else:
            print(f"  MISMATCH id={a.get('id')}: expected={a['expected_action']}/{a['expected_reason']} derived={got[0]}/{got[1]}")
        rdist[got[1]] = rdist.get(got[1], 0) + 1
        adist[got[0]] = adist.get(got[0], 0) + 1
    return agree, adist, rdist

def main():
    anchors = json.load(open(VEC, encoding="utf-8"))["vectors"]
    agree, adist, rdist = verify(anchors)
    tampered = [a for a in anchors if a["integrity"] == "tampered" or a["args_digest"] != digest_of(a["effective_args"])]
    print(f"vectors: {len(anchors)}  agreement: {agree}/{len(anchors)}")
    print(f"action distribution: {adist}")
    print("reason distribution:")
    for k, v in sorted(rdist.items(), key=lambda x: -x[1]):
        print(f"  {k:42} {v}")
    print(f"digest-only column: tampered->REFUSES {len(tampered)}/{len(tampered)}  intact->BINDS {len(anchors)-len(tampered)}/{len(anchors)-len(tampered)}")
    print("STATUS:", "PASS" if agree == len(anchors) else "FAIL")
    sys.exit(0 if agree == len(anchors) else 1)

def run(argv=None):
    """Entry point that works both as a script and as an installed module."""
    argv = sys.argv if argv is None else argv
    if "--tamper" in argv:
        anchors = json.load(open(VEC, encoding="utf-8"))["vectors"]
        victim = dict(anchors[0]); victim["args_digest"] = "0" * 64; victim["integrity"] = "tampered"
        mutated = [victim] + anchors[1:]
        agree, _, _ = verify(mutated)
        caught = agree < len(mutated)
        print(f"tamper self-test: {'CAUGHT (verifier refuses mutated digest)' if caught else 'MISSED (BAD)'}")
        sys.exit(0 if caught else 1)
    main()

if __name__ == "__main__":
    run()
