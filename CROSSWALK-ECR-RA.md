# CROSSWALK-ECR-RA.md — ECR reason codes × Recovery Admission 576 suite

**状态**: v1.0 (2026-11-16) · **维护者**: Correctover（DSHCorrectover）
**目的**: 统一对外词汇表。ECR（Evidence-Carrying Runtime，执行侧）的 8 个收据 reason code 与 RA suite（验证侧，576 anchors）的判定语义是两条正交轴。本文档是接口契约：**ECR 回答"这次恢复改变了什么"，RA 回答"这次恢复该不该被放行"**。任何下游（OEM/审计/验证者）拿 ECR 收据接入 RA suite 时，以本映射为准。

> ⚠️ ECR 8-code 线由云端主对话侧维护（neuralbridge-ecr-20261116，D1 已完成）。
> 本 crosswalk 基于 D1 产物声明的语义建立；ECR 源文件独立重放完成前，
> 映射表状态为 **PROVISIONAL again (2026-11-16 correction): my earlier FROZEN was premature — the five-check condition requires replaying the ORIGINAL byte-level suite, not my reference rebuild. Awaiting coze-handover push; original README received 22:14, code files pending. Also adopting the original suite's honest boundaries into this crosswalk: (a) args_digest covers params only, NOT correlation_id — "chains back to that failure" degrades to "chains back to those params"; (b) r1-r8 share failed_decision_hash except r4 — never feed all anchors through a single seen-set or recovery-replay misfires on six anchors.

---

## 1. 轴的正交性（对外口径一句话）

- **ECR code** = 收据内容的变更分类（what changed）——8 条，词汇表
- **RA code** = 准入判定与理由（whether allowed & why）——576 锚穷举 6 维
- 同一张恢复收据，ECR 分类它、RA 判定它。两者叠加 = 完整语义：`[RA action] + [ECR change class]`
- **对外话术锁死**：ECR 是"让 runtime 自己签收据"的执行侧身份；RA 是"判定语义可反驳"的验证侧身份。同一产品两个面，永远成对出现。

## 2. 映射表（ECR code → RA 预期判定）

原则：**RA 是 fail-closed 闸门**。ECR 收据若声称任何权限变更且无完整 delegation/integrity 绑定，RA 必须拒绝。只有 `authority-unchanged` 在干净路径上才应 BINDS/ALLOW。

| # | ECR code（变更类） | 语义 | RA 预期 action | RA 对应 reason 族 | 576 锚中对应证据 |
|---|---|---|---|---|---|
| 1 | `unresolved-failure-ref` | 收据声称修复某 failure 但引用不可解析 | **REFUSES** | integrity-digest-tampered 族（不可验证即篡改语义） | digest-only 负分支 288/288 |
| 2 | `recovery-replay` | 同一收据重放 | **REFUSES** | integrity-digest-tampered + digest 唯一性 | args_digest 绑定维 |
| 3 | `param-widening` | 恢复参数超出原请求范围 | **REFUSES** | version-major-drift / integrity 族（effective_args 变更 → digest 失配） | effective_args digest 维 |
| 4 | `capability-downgrade` | 恢复权限低于原授权 | **DOWNGRADE 或 REFUSES** | scope-reduced-retry（降级保留 intent hash） | scope-reduced-retry ×2 |
| 5 | `execution-set-change` | 执行目标集合改变 | **REFUSES** | delegation-broken-chain（链断裂即目标漂移） | 72 锚 |
| 6 | `subject-drift` | 主体漂移 | **REFUSES** | identity-revoked-local / -propagated + agent_id_preimage 尾绑定 | 36+36 锚 |
| 7 | `unapproved-path` | 未经批准的执行路径 | **ESCALATE 或 REFUSES** | human-gate-required / no-chain-cannot-bind-state-action | 3+27 锚 |
| 8 | `authority-unchanged` | 权限未变（合规恢复） | **ALLOW/BINDS** | clean / no-chain-readonly-local-bind | clean ×7 + readonly ×6 |

**合并判读规则**（接入方执行）：
```
if ECR_code in {1,2,3,5,6}          → RA 必须 REFUSES；若 RA 放行 = 两系统矛盾，立即上报（品级最高）
if ECR_code == 4                    → RA 只允许 DOWNGRADE/REFUSES，ALLOW = 矛盾
if ECR_code == 7                    → RA 只允许 ESCALATE/REFUSES，ALLOW = 矛盾
if ECR_code == 8 && RA == REFUSES   → 核查 delegation 链；若链完好且 integrity 干净 = 矛盾
矛盾矩阵中任何一个"必须翻转"命中 → 该组合即为可上报的反例，按 VERIFIED_BY.md 署名
```

## 3. 词汇表优先级

- ECR 8-code 是**品类词汇表**（如同 HTTP 状态码）；RA 576-code 是**判例法**（穷举证明词汇表判得对）。
- 新增 ECR code 必须先在 RA suite 里有对应锚（或补锚），否则该 code 不进入 crosswalk = 对外不可引用。

## 4. 独立重放状态（双沙箱对账）

| 项 | 状态 |
|---|---|
| ECR 产物（697 行：定义/原型 279/向量 286/验证器 132） | ⏳ 待云端导出，重放未执行 |
| 重放清单 | ① `verify-recovery.py`(ECR版) 8/8 PASS ② 变异翻转 7/8 ③ 改回复原 8/8 ④ 残留检查 four/d-aaa/placeholder/TODO 零命中 ⑤ docstring 与输出行逐字对齐 |
| 重放通过后 | 本文档 PROVISIONAL again (2026-11-16 correction): my earlier FROZEN was premature — the five-check condition requires replaying the ORIGINAL byte-level suite, not my reference rebuild. Awaiting coze-handover push; original README received 22:14, code files pending. Also adopting the original suite's honest boundaries into this crosswalk: (a) args_digest covers params only, NOT correlation_id — "chains back to that failure" degrades to "chains back to those params"; (b) r1-r8 share failed_decision_hash except r4 — never feed all anchors through a single seen-set or recovery-replay misfires on six anchors.
