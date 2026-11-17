#!/usr/bin/env node
// Independent verifier (Node port of verify-recovery.py — different language, same derivation contract)
// Dataset CC0: DOI 10.5281/zenodo.24280454 · Code Apache-2.0
// Refutations are credit-worthy (VERIFIED_BY.md): negative results credited same-or-better.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const VEC = new URL('./recovery-admission-v3-vectors.json', import.meta.url);
const d2 = args => createHash('sha256').update(JSON.stringify(args, Object.keys(args).sort())).digest('hex');
const major = v => parseInt(String(v).split('.')[0], 10);

function derive(a) {
  const ra = a.side_effect_class;
  const fresh = a.runtime === 'fresh';
  const verOk = major(a.dispatched_tool_version) === major(a.approved_tool_version);
  const deleg = a.deleg, revoked = !!(a.revoked || a.principal_revoked), integ = a.integrity === 'tampered';
  if (integ || a.args_digest !== d2(a.effective_args)) return ['REFUSES', 'integrity-digest-tampered'];
  if (deleg === 'chained-valid' && revoked) return ['REFUSES', 'identity-revoked-propagated'];
  if (deleg === 'tail-mismatch') return ['REFUSES', 'delegation-tail-mismatch'];
  if (deleg === 'broken-chain') return ['REFUSES', 'delegation-broken-chain'];
  if (deleg === 'none-direct' && revoked) return ['REFUSES', 'identity-revoked-local'];
  if (deleg === 'none-direct' && ra !== 'readonly') return ['REFUSES', 'no-chain-cannot-bind-state-action'];
  if (!verOk) return ['REFUSES', 'version-major-drift'];
  // RA3-0037 adjudication (Xinghua review 2026-11-17): traffic-moving rebind on
  // unapproved patch drift escalates exactly like the irreversible class does.
  if (ra === 'failover') {
    if (a.runtime !== 'fresh') return ['REFUSES', 'failover-without-fresh-sbsr'];
    return a.dispatched_tool_version === a.approved_tool_version ? ['ALLOW', 'failover-sbsr-rebind'] : ['ESCALATE', 'human-gate-required'];
  }
  if (deleg === 'none-direct') return ['ALLOW', 'no-chain-readonly-local-bind'];
  if (!a.upstream_ok) return ['HOLD', 'intent-hash-preserved-no-silent-rewrite'];
  // F3a fix (Xinghua review): highest-risk class must not share 'clean' with readonly.
  if (ra === 'irreversible') return (fresh && a.dispatched_tool_version === a.approved_tool_version) ? ['ALLOW', 'irreversible-authorized-exact-fresh'] : ['ESCALATE', 'human-gate-required'];
  if (ra === 'state-write' && !fresh) return ['DOWNGRADE', 'scope-reduced-retry'];
  return ['ALLOW', deleg === 'none-direct' ? 'no-chain-readonly-local-bind' : 'clean'];
}

function verify(anchors) {
  let agree = 0;
  for (const a of anchors) if (JSON.stringify(derive(a)) === JSON.stringify([a.expected_action, a.expected_reason])) agree++;
  return agree;
}

const anchors = JSON.parse(readFileSync(VEC, 'utf8')).vectors;
const tamper = process.argv.includes('--tamper');
if (tamper) {
  const victim = { ...anchors[0], args_digest: '0'.repeat(64), integrity: 'tampered' };
  const mutated = [victim, ...anchors.slice(1)];
  const caught = verify(mutated) < mutated.length;
  console.log(`tamper self-test: ${caught ? 'CAUGHT (verifier refuses mutated digest)' : 'MISSED (BAD)'}`);
  process.exit(caught ? 0 : 1);
}
const agree = verify(anchors);
console.log(`vectors: ${anchors.length}  agreement: ${agree}/${anchors.length}`);
console.log('STATUS:', agree === anchors.length ? 'PASS' : 'FAIL');
process.exit(agree === anchors.length ? 0 : 1);
