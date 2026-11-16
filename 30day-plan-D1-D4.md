# ECR 30 天最小落地 —— 原计划 + 真实状态台账

来源：`ecr/d1-original/NeuralBridge-品类定义-ECR-20261116.md` 第九节（原样抽取，不改一字）。
本文件只做两件事：**保留云端侧的设计意图**，以及**逐项标出每一步真实做到哪里**。
下游接手时以「真实状态」列为起点，不以「原计划」列为起点。

---

## 一、原计划（逐字）

| 天 | 动作 | 验收 |
|---|---|---|
| D1–D2 | 写 `recovery-receipt.mjs` 原型（Node 内置 crypto，零依赖），输入一个 recovery 事件，输出签名收据 + IN_SCOPE/OUT_OF_SCOPE 判定 | 能跑，能验，能篡改检测 |
| D3–D4 | 把 `legacy/dist/engine.js` 的 `CallResult` 挂上 recovery receipt 生成（不改 legacy 源码，外面包一层） | 一次真实 retry 能产出收据 |
| D5–D6 | 写 3 条 recovery 向量 + 独立 verifier（沿用 PR #12 的 author-set 纪律） | 3/3 零分歧 |
| D7 | 把 README 从 "flight recorder" 升级成 ECR 品类定义 | README 一屏能说清品类 |
| D8–D10 | 开新 PR（或在 ccs-conformance-vectors 开新 author-set）：`recovery` 向量组 | 远端可跑，7+3 = 10 条全绿 |
| D11–D20 | 找 5 个 MCP 网关厂商，用「你的重试改了什么」开场（不是「你有安全问题」） | ≥2 条回复 |
| D21–D30 | 1 个付费试点或 1 个 OEM 技术评估 | 破零 |

**D1 的第一个动作今天就能做**：写 `recovery-receipt.mjs`，因为 `RecoveryAction` / `RecoveryLevel` 的枚举已经在手，schema 已经在上面第四节定好了。

---

## 二、真实状态（云端侧终态，2026-11-16）

| 阶段 | 状态 | 实际交付 |
|---|---|---|
| **D1** | ✅ **完成并超额** | `recovery-receipt.mjs` 279 行：8 case / 8 reason code 全覆盖 / 实跑 8/8 / 篡改 REJECTED。超出原计划的「一个 recovery 事件」，做成了完整 8 场景链 |
| **D2** | ✅ **完成** | 品类定义文档 10 节 + 事实来源表 9 行（`ecr/d1-original/NeuralBridge-品类定义-ECR-20261116.md`） |
| **D3** | ❌ **完全未动** | 需要 `legacy/dist/engine.js` 的 `CallResult`，本次已随 `legacy-context/` 一并交接 |
| **D4** | ❌ **完全未动** | 同上。D3–D4 的唯一前提就是 `legacy-context/`，没有它只能做 demo 替身 |
| **D5–D6** | ✅ **完成并超额** | 原计划 3 条向量 → 实交 **8 条**（`recovery-vectors-v1.json` 286 行，真 64-hex digest）；独立 verifier `verify-recovery.py` 132 行，**8/8 零分歧**，其中 7 条 binding-alone（digest-only 管道放行、binding 拒绝） |
| **D7** | ✅ **完成** | README 升级为 ECR 品类定义（`ecr/d1-original/README.md`）。⚠️ 已知瑕疵：prototype 期望输出段用 `...` 省略 7 行明细，非逐字。**按交接要求原样保留未修** —— 对拍基准必须是真实终态 |
| **D8–D10** | ❌ **未动** | 未开 PR / 未建 author-set |
| **D11–D20** | ❌ **未动** | 未接触任何 MCP 网关厂商 |
| **D21–D30** | ❌ **未动** | 未破零 |

### 已完成的六层验证（D1 + D5–D6 的实际证据强度）

1. **全绿**：`verify-recovery.py` → `8/8 verdicts agree`；`recovery-receipt.mjs` → `8/8 reason codes exercised`
2. **变异翻转**：verifier 侧改 `r8` 的 `args_digest` → `7/8`，`unresolved-failure-ref` 消失；prototype 侧改 case 8 → `7/8`
3. **改回复原**：两处变异后重跑原文件 → 均回 `8/8`
4. **残留零命中**：`four` / `d-aaa` / `placeholder` / `TODO` 四个占位符全文零命中
5. **docstring 与输出对齐**：verifier 判定顺序注释与 `verdict_rules` 位置逐条一致
6. **双实现独立**：verifier 从 schema 独立写，不 import / 不调用 prototype

---

## 三、产物位置索引（本分支）

| 项 | 路径 | 行数 / 字节 |
|---|---|---|
| 定义文档 | `ecr/d1-original/NeuralBridge-品类定义-ECR-20261116.md` | 13,977 B |
| 原型 | `ecr/d1-original/recovery-receipt.mjs` | 279 行 / 10,468 B |
| 向量 | `ecr/d1-original/recovery-vectors-v1.json` | 286 行 / 15,380 B |
| 独立 verifier | `ecr/d1-original/verify-recovery.py` | 132 行 / 5,259 B |
| README（D7） | `ecr/d1-original/README.md` | 9,649 B |
| 引擎上下文 | `legacy-context/` | 7 文件，`CallResult` 在 `types.d.ts` 第 109 行 |

**三技术文件合计 697 行**（279 + 286 + 132），与声明一致。

---

## 四、D3–D4 接手要点（交接备注，非计划内容）

- `CallResult` 定义：`legacy-context/types.d.ts` 第 109 行 `export interface CallResult {`（同文件第 216 行有递归引用 `raw?: CallResult;`）
- 12 字段已含八个恢复维度：`attempts` / `fallbackUsed` / `downgraded` / `healLevel` / `diagnosis` / `trace` / `provider`+`model` / `latencyMs`
- **缺的只有签名和链** —— 这就是 D3–D4 的全部工作量
- 原计划的约束：**不改 legacy 源码，外面包一层**
- `legacy-context/engine.d.ts` 头部声明三层零交叉架构（L1 Diagnoser 只诊断 / HA Layer 只动手 / L4 Flywheel 只出策略），挂接点应选在 MAPE-K 的 Execute 阶段之后
