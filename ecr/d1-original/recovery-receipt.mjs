#!/usr/bin/env node
/**
 * recovery-receipt.mjs — ECR 品类的最小可跑原型
 *
 * 主张：自动恢复是唯一一个可以合法绕过授权体系、且不留下可验证痕迹的执行路径。
 * 本原型让「恢复动作」变成一等公民的可验证事件。
 *
 * 零运行时依赖（只用 Node 内置 crypto）。
 * 判定口径与 CCS 一致：Ed25519 over JCS(body)，SHA-256 链到上一条。
 *
 * 八步判定与 verify-recovery.py 逐条对齐（v1.1 起）：八个 reason code
 * 全部有用例、全部可被触发，没有一条是死代码。
 *
 * 用法：node recovery-receipt.mjs
 */

import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';

/* ── JCS (RFC 8785) —— ASCII 安全子集，与 gateway.mjs / verify.py 同一套管道 ── */
function jcs(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(jcs).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + jcs(v[k])).join(',') + '}';
}

function digest(v) {
  return createHash('sha256').update(jcs(v), 'utf8').digest('hex');
}

/* ── 判定：这是整个品类的心脏 ──
 * 顺序按「危害 × 检测难度」排，靠前的会吃掉靠后的，所以每个用例必须单原因。
 */
function classify(ev, seenFailedHashes) {
  // 0. 记录必须指得出它恢复的是哪次失败
  //    （收据自己声明的失败参数摘要 != 它链接的失败 hash → 链断了）
  if (ev.failed_decision_args_digest !== undefined &&
      ev.failed_decision_args_digest !== ev.failed_decision_hash) {
    return { verdict: 'OUT_OF_SCOPE', reason: 'unresolved-failure-ref' };
  }
  // 1. 同一次失败被恢复两次 —— 副作用可能重复
  if (seenFailedHashes.has(ev.failed_decision_hash)) {
    return { verdict: 'OUT_OF_SCOPE', reason: 'recovery-replay' };
  }
  // 2. 参数漂移（直接命中 PR #12 的 param-widening）
  const pb = digest(ev.params_before);
  const pa = digest(ev.params_after);
  if (pb !== pa) {
    return { verdict: 'OUT_OF_SCOPE', reason: 'param-widening' };
  }
  // 3. 动作本身改变能力边界（比 subject-drift 更本质，优先报）
  if (ev.action === 'downgrade') {
    return { verdict: 'OUT_OF_SCOPE', reason: 'capability-downgrade' };
  }
  if (ev.action === 'skip_provider') {
    return { verdict: 'OUT_OF_SCOPE', reason: 'execution-set-change' };
  }
  // 4. 主体漂移（FAILOVER 换了执行者）
  if (ev.subject_before !== ev.subject_after) {
    return { verdict: 'OUT_OF_SCOPE', reason: 'subject-drift' };
  }
  // 5. 飞轮自学出来的路径 —— 从未被任何人批准过
  if (ev.level === 'l4_learned') {
    return { verdict: 'OUT_OF_SCOPE', reason: 'unapproved-path' };
  }
  // 6. 其余：授权不变，同一件事再试一次
  return { verdict: 'IN_SCOPE', reason: 'authority-unchanged' };
}

/* ── 签发 ── */
function issue(ev, prevHash, privateKey, seenFailedHashes) {
  const { verdict, reason } = classify(ev, seenFailedHashes);
  const body = {
    type: 'recovery',
    correlation_id: ev.correlation_id,
    recovered_at: ev.recovered_at,
    failed_decision_hash: ev.failed_decision_hash,
    failed_decision_args_digest: ev.failed_decision_args_digest ?? ev.failed_decision_hash,
    action: ev.action,
    level: ev.level,
    subject_before: ev.subject_before,
    subject_after: ev.subject_after,
    params_before_digest: digest(ev.params_before),
    params_after_digest: digest(ev.params_after),
    attempt: ev.attempt,
    verdict,
    reason,
    prev_hash: prevHash,
  };
  const signature = sign(null, Buffer.from(jcs(body), 'utf8'), privateKey).toString('base64');
  seenFailedHashes.add(ev.failed_decision_hash);
  return { body, payload_hash: digest(body), signature };
}

/* ── 离线验证（第三方不需要信任 producer）── */
function verifyReceipt(r, publicKey, prevHash) {
  const okSig = verify(
    null,
    Buffer.from(jcs(r.body), 'utf8'),
    publicKey,
    Buffer.from(r.signature, 'base64')
  );
  const okChain = r.body.prev_hash === prevHash;
  const okHash = digest(r.body) === r.payload_hash;
  return { okSig, okChain, okHash, ok: okSig && okChain && okHash };
}

/* ═══════════════════════ 演示 ═══════════════════════ */

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const seen = new Set();
let prev = 'GENESIS';
const chain = [];

function run(label, ev) {
  const r = issue(ev, prev, privateKey, seen);
  prev = r.payload_hash;
  chain.push(r);
  const mark = r.body.verdict === 'IN_SCOPE' ? '  ' : '!!';
  console.log(
    `${mark} ${label.padEnd(30)} ${r.body.action.padEnd(15)} ${r.body.level.padEnd(13)} ` +
    `${r.body.verdict.padEnd(13)} ${r.body.reason}`
  );
  return r;
}

/* 真实失败的参数摘要 —— 与 verify-recovery.py 的 recovery-vectors-v1.json 同源口径 */
const PAY100 = { tool: 'send_payment', to: 'acct-A', amount: 100 };
const PAY100_Z = { tool: 'send_payment', to: 'acct-Z', amount: 100 };
const H_PAY100 = digest(PAY100);
const H_PAY100_Z = digest(PAY100_Z);

console.log('=== ECR recovery receipts ===\n');
console.log('   ' + 'case'.padEnd(30) + 'action'.padEnd(15) + 'level'.padEnd(13) + 'verdict'.padEnd(13) + 'reason');
console.log('   ' + '-'.repeat(95));

// 1. 正常重试：授权不变
run('plain retry', {
  correlation_id: 'c-001',
  recovered_at: '2026-11-16T10:00:01.000Z',
  failed_decision_hash: H_PAY100,
  action: 'retry',
  level: 'l1_retry',
  subject_before: 'provider-A',
  subject_after: 'provider-A',
  params_before: PAY100,
  params_after: PAY100,
  attempt: 2,
});

// 2. 重试时把金额放大了 —— 这就是 param-widening
run('retry with widened amount', {
  correlation_id: 'c-002',
  recovered_at: '2026-11-16T10:00:02.000Z',
  failed_decision_hash: digest({ tool: 'send_payment', to: 'acct-B', amount: 100 }),
  action: 'fix_request',
  level: 'l1_retry',
  subject_before: 'provider-A',
  subject_after: 'provider-A',
  params_before: { tool: 'send_payment', to: 'acct-B', amount: 100 },
  params_after: { tool: 'send_payment', to: 'acct-B', amount: 250 },
  attempt: 2,
});

// 3. 切 provider —— 换了执行主体
run('failover to provider-B', {
  correlation_id: 'c-003',
  recovered_at: '2026-11-16T10:00:03.000Z',
  failed_decision_hash: digest({ tool: 'send_payment', to: 'acct-C', amount: 100 }),
  action: 'failover',
  level: 'l3_failover',
  subject_before: 'provider-A',
  subject_after: 'provider-B',
  params_before: { tool: 'send_payment', to: 'acct-C', amount: 100 },
  params_after: { tool: 'send_payment', to: 'acct-C', amount: 100 },
  attempt: 2,
});

// 4. 降级 —— 静默降低质量
run('downgrade model', {
  correlation_id: 'c-004',
  recovered_at: '2026-11-16T10:00:04.000Z',
  failed_decision_hash: digest({ tool: 'chat', model: 'gpt-4' }),
  action: 'downgrade',
  level: 'l2_downgrade',
  subject_before: 'gpt-4',
  subject_after: 'gpt-4-mini',
  params_before: { tool: 'chat' },
  params_after: { tool: 'chat' },
  attempt: 2,
});

// 5. 飞轮自学路径 —— 谁都没批过
run('flywheel learned path', {
  correlation_id: 'c-005',
  recovered_at: '2026-11-16T10:00:05.000Z',
  failed_decision_hash: digest({ tool: 'search', q: 'x' }),
  action: 'retry',
  level: 'l4_learned',
  subject_before: 'provider-A',
  subject_after: 'provider-A',
  params_before: { tool: 'search', q: 'x' },
  params_after: { tool: 'search', q: 'x' },
  attempt: 2,
});

// 6. 同一次失败被恢复两次 —— replay（复用 case 1 的失败 hash）
run('replay same failure', {
  correlation_id: 'c-001',
  recovered_at: '2026-11-16T10:00:06.000Z',
  failed_decision_hash: H_PAY100,
  action: 'retry',
  level: 'l1_retry',
  subject_before: 'provider-A',
  subject_after: 'provider-A',
  params_before: PAY100,
  params_after: PAY100,
  attempt: 3,
});

// 7. 从执行集合里剔掉一个 provider —— 调用方批准的是三个，实际只跑了两个
run('skip one provider', {
  correlation_id: 'c-006',
  recovered_at: '2026-11-16T10:00:07.000Z',
  failed_decision_hash: digest({ tool: 'send_payment', to: 'acct-D', amount: 100 }),
  action: 'skip_provider',
  level: 'l1_retry',
  subject_before: 'provider-A',
  subject_after: 'provider-A',
  params_before: { tool: 'send_payment', to: 'acct-D', amount: 100 },
  params_after: { tool: 'send_payment', to: 'acct-D', amount: 100 },
  attempt: 2,
});

// 8. 收据自己声明的失败参数摘要，和它链接的失败 hash 对不上 —— 链断了
//    其余字段全部正常：同一 subject、同一 params、普通 retry、l1。
//    这条用例是第 0 步唯一的开火证据，去掉它第 0 步就是死代码。
run('unresolved failure ref', {
  correlation_id: 'c-007',
  recovered_at: '2026-11-16T10:00:08.000Z',
  failed_decision_hash: H_PAY100_Z,
  failed_decision_args_digest: '0'.repeat(64),
  action: 'retry',
  level: 'l1_retry',
  subject_before: 'provider-A',
  subject_after: 'provider-A',
  params_before: PAY100_Z,
  params_after: PAY100_Z,
  attempt: 2,
});

/* ── 链完整性 + 篡改检测 ── */
console.log('\n=== chain verification ===');
let prevCheck = 'GENESIS';
let allOk = true;
for (let i = 0; i < chain.length; i++) {
  const v = verifyReceipt(chain[i], publicKey, prevCheck);
  allOk = allOk && v.ok;
  prevCheck = chain[i].payload_hash;
  if (!v.ok) {
    console.log(`  FAIL #${i} sig=${v.okSig} chain=${v.okChain} hash=${v.okHash}`);
  }
}
console.log(`  ${allOk ? 'OK' : 'FAIL'}  ${chain.length}/${chain.length} receipts verify (sig + chain + hash)`);

// 篡改第 2 条（把 verdict 从 OUT_OF_SCOPE 改成 IN_SCOPE）
const tampered = JSON.parse(JSON.stringify(chain[1]));
tampered.body.verdict = 'IN_SCOPE';
const tv = verifyReceipt(tampered, publicKey, chain[0].payload_hash);
console.log(`  tamper test: sig=${tv.okSig ? 'PASS' : 'REJECTED'}  (期望 REJECTED)`);

const outOfScope = chain.filter(r => r.body.verdict === 'OUT_OF_SCOPE');
console.log(`\n  ${outOfScope.length} of ${chain.length} recoveries are OUT_OF_SCOPE:`);
for (const r of outOfScope) {
  console.log(`    - ${r.body.action} / ${r.body.level} -> ${r.body.reason}`);
}

const reasons = new Set(chain.map(r => r.body.reason));
console.log(`\n  ${reasons.size}/8 reason codes exercised: ${[...reasons].sort().join(', ')}`);
