# NeuralBridge → 新品类：Evidence-Carrying Runtime (ECR)

> 2026-11-16 ｜ 内部战略文档 ｜ 基于当天 `DSHCorrectover/neuralbridge` 实际代码（71 文件 / 251 KB）+ 我方 CCS 能力栈

---

## 一句话

**带证运行时（Evidence-Carrying Runtime）：每一个 agent 动作在离开进程之前就带着一份别人能独立复核的判决；失败了它自己恢复，恢复过程同样留证。**

副标题（对外钩子）：**the runtime that signs its own recovery.**

---

## 一、为什么现在是个空位

今天所有做 AI Agent 基础设施的人，都在三个割裂的世界里各干一头：

| 世界 | 代表 | 它做什么 | 它做不到什么 |
|---|---|---|---|
| **可观测性** | LangSmith / Langfuse / Helicone | 记录发生了什么 | 记录是应用自己写的，**出事时不能自证**；且只记录，不干预 |
| **安全网关** | Pangea / Lakera / Protect AI / 各类 MCP proxy | 拦截危险调用 | **拦完就死**，agent 任务失败；拦截理由不可被第三方复核 |
| **可靠性** | retry / circuit breaker / failover / 各类 LLM 路由 | 重试、降级、切 provider | **重试了什么、改了什么，说不清**；恢复动作完全不可审计 |

这三件事**从来不在一个东西里**。

而 NB 的 `gateway.mjs`（v0.1，4862 B，零依赖，一行启动）+ `legacy/` 里的 MAPE-K 自愈引擎（`RecoveryAction` / `RecoveryLevel` / `PhaseRecord` 全都在）+ 我方 CCS 收据链（Ed25519 + JCS + SHA-256 hash chain + 离线 Public Verifier），**恰好是这三块拼图的三片**。

拼起来之后，空位就很清楚了：**没有人在做"拦得住 + 救得回 + 事后谁都赖不掉"这三件事的同一层。**

---

## 二、立论：自动恢复是唯一能绕过授权的执行路径

这是整个品类的立论，也是全网没人说过的一句话：

> **自动恢复是唯一一个可以合法绕过授权体系、且不留下可验证痕迹的执行路径。**

依据不是修辞，是 `legacy/dist/types.d.ts` 里的实际枚举。`RecoveryAction` 八个值：

```
RETRY               重试           —— 授权不变
WAIT_AND_RETRY      等待后重试     —— 授权不变
DOWNGRADE           降级           —— ⚠️ 静默降低输出质量
FAILOVER            切 provider    —— ⚠️ 静默更换执行主体
SKIP_PROVIDER       跳过 provider  —— ⚠️ 静默改变执行集合
CHECK_CREDENTIALS   查凭据         —— 授权不变
FIX_REQUEST         修改请求       —— ⚠️ 静默变更参数
NONE                不恢复
```

**八个动作里有四个会改变授权边界**，而这四个在传统系统里只是日志里的一行，或者连一行都没有。

再看 `RecoveryLevel` 四级：

```
L1_RETRY      重试
L2_DOWNGRADE  降级
L3_FAILOVER   切主体
L4_LEARNED    飞轮学到的策略   —— ⚠️⚠️ 系统自己新增了一条从来没人批准过的恢复路径
```

**`L4_LEARNED` 是最危险的一级。** 它不是"人写了规则然后执行"，是"系统根据历史自己长出了一条路径，然后开始走"。这条路径在设计时不存在，在审批时不存在，只在实际执行时存在。

**这就是我们唯一能主张、而竞品无法主张的一句话：**

> 别人在问"这个 agent 做了什么"，我们在问"这个 agent 在失败的时候，被允许改变什么"。

---

## 三、品类定义：三支柱

### Decide（拦）
- allowlist + tool-identity + label-integrity + param-binding + subject-binding + freshness
- fail-closed
- 已落地：`gateway.mjs` v0.1 的 `NEURALBRIDGE_ALLOW` + 我方 7 维 CCS 检验 + PR #12 的 7 条 falsifiable 向量

### Recover（救）
- MAPE-K 自适应环：Monitor → Analyze → Plan → Execute → Knowledge
- circuit-breaker / bulkhead / rate-limiter / checkpoint / diagnoser / flywheel
- 已落地：`legacy/dist/` 16 模块，全部编译产物 + `.d.ts` + sourcemap

### Prove（证）
- Ed25519 签名 + JCS(RFC 8785) 规范化 + SHA-256 hash chain
- 离线 Public Verifier，第三方不需要信任 producer
- 已落地：CCS 收据格式 + `receipts/chain.jsonl` + IETF `draft-correctover-ccs` rev 10

**三支柱缺任何一条，品类就不成立：**
- 缺 Decide → 只是个记录仪，等于现有可观测性
- 缺 Recover → 只是个网关，等于现有安全产品
- 缺 Prove → 只是个自愈库，等于现有可靠性产品

---

## 四、最狠的一刀：Recovery as a Verifiable Event

**把恢复动作本身变成一等公民的可验证事件。**

收据类型从一种扩成两种：

```jsonc
// decision_receipt —— 已有的
{ "type": "decision", "correlation_id": "...", "decided_at": "...",
  "tool": "...", "args_digest": "SHA-256(JCS(args))",
  "verdict": "ALLOW|DENY", "prev_hash": "..." }

// recovery_receipt —— 新增的
{ "type": "recovery", "correlation_id": "...", "recovered_at": "...",
  "failed_decision_hash": "...",      // 链到那次失败的判决
  "action": "DOWNGRADE",              // RecoveryAction
  "level": "L2_DOWNGRADE",            // RecoveryLevel
  "subject_before": "provider-A",
  "subject_after":  "provider-B",     // FAILOVER 时不等 → subject drift
  "params_before_digest": "...",
  "params_after_digest":  "...",      // FIX_REQUEST 时不等 → param widening
  "attempt": 2,
  "verdict": "IN_SCOPE|OUT_OF_SCOPE", // 关键判定
  "prev_hash": "..." }
```

**核心判定逻辑（这是整个品类的技术心脏）：**

| 恢复动作 | 判定 | 含义 |
|---|---|---|
| `RETRY` / `WAIT_AND_RETRY` / `CHECK_CREDENTIALS` | `IN_SCOPE` | 授权不变，同一件事再试一次 |
| `DOWNGRADE` | `OUT_OF_SCOPE` | 输出质量变了，调用方可能不知道 |
| `FAILOVER`（subject 变） | `OUT_OF_SCOPE` | 换了执行主体 |
| `FIX_REQUEST`（params 变） | `OUT_OF_SCOPE` | **直接命中 PR #12 的 param-widening** |
| `L4_LEARNED`（首次出现） | `OUT_OF_SCOPE` | 新路径，从未被批准 |

**这一刀为什么狠：**

传统系统里，"重试时把 timeout 从 5s 调到 30s"、"降级到便宜模型"、"切到备用 provider"，都是**运维优化**，没人觉得需要授权。

但在 agent 系统里，这三件事等价于：
- 参数被放宽（param-widening）
- 质量被静默降低
- 执行主体被换掉

**它们是授权漂移，不是运维优化。**

而所有现有产品在这个时刻都是黑箱。因为恢复是系统最脆弱的时刻——最容易越权，最容易丢证据，最没人看。

---

## 五、和所有现有方案的差异

| 能力 | 可观测性 | 安全网关 | 可靠性库 | **ECR（我们）** |
|---|---|---|---|---|
| 记录动作 | ✅ | ✅ | ❌ | ✅ |
| 记录可被第三方独立复核 | ❌ | ❌ | ❌ | ✅ |
| 拦截 | ❌ | ✅ | ❌ | ✅ |
| 拦完还能继续跑 | ❌ | ❌ | — | ✅ |
| 自愈 | ❌ | ❌ | ✅ | ✅ |
| **自愈动作本身可验证** | ❌ | ❌ | ❌ | ✅ |
| 离线验证（不信 producer） | ❌ | ❌ | ❌ | ✅ |
| 零运行时依赖 | — | 多半有 | 多半有 | ✅ |

**唯一一行全部 ✅ 的，是最后一列。这一列就是品类。**

---

## 六、四层结构（每层都有实物，不是 PPT）

```
标准层    draft-correctover-ccs rev 10（IETF individual submission）
          + ECR 的 recovery receipt 定义（待写成 -11 的新节）
             ↓
产品层    Receipt SDK（可嵌）+ Public Verifier（CC0 离线）  ← v16 两件，不变
             ↓
参考实现  NeuralBridge gateway v0.2（Node，零依赖，一行启动）
          = gateway.mjs（Decide+Prove）+ legacy MAPE-K（Recover）+ recovery_receipt
             ↓
向量层    PR #12 已有 7 条 tool-binding anchors
          + 新增 3 条 recovery anchors（见下节）
```

**关键：NeuralBridge 不是产品，是参考实现。** 产品还是 v16 那两件（Receipt SDK + Public Verifier）。这样不破坏 v16 定位，反而给 v16 补上了「客户拿来就能跑」的那一层。

---

## 七、三条新向量（falsifiable，可直接进 conformance corpus）

延续 PR #12 的 author-set 纪律：**每条都必须能被 digest-only 管道判错，只有 binding 判对。**

### 1. `recovery-param-widening`
```
第一次调用：send_payment(amount=100)  → TIMEOUT → 失败
自动恢复：FIX_REQUEST，amount 改成 250 → 成功
收据：decision 两条 + recovery 一条（verdict=OUT_OF_SCOPE）
digest-only 管道：两条 decision 的 digest 都对，通过
binding：recovery receipt 的 params_before ≠ params_after → REFUSES
```

### 2. `recovery-subject-drift`
```
第一次调用：provider-A，subject=agent-X → 失败
自动恢复：FAILOVER 到 provider-B，subject 变成 agent-Y → 成功
digest-only：通过
binding：subject_before ≠ subject_after → REFUSES
```

### 3. `recovery-replay`
```
同一次失败（同一 failed_decision_hash）被触发两次恢复
第二次恢复的副作用重复（重复扣款 / 重复发信）
digest-only：两条 recovery 各自合法，通过
binding：failed_decision_hash 已出现过 → REFUSES（幂等性）
```

**这三条的价值：它们全是"看起来完全正常、digest 全对、只有解析恢复链才判得出"的案子。** 和 PR #12 的 5 条 REFUSES 是同一族，但打的是全新的面。

---

## 八、商业路径（对齐 v16，不破定位）

| 项 | 内容 |
|---|---|
| **客户** | 平台厂商（MCP 网关 / Agent 平台 / Agent 编排框架），**不是企业终端** |
| **卖什么** | Receipt SDK（嵌进他们的网关）+ Public Verifier（他们的客户离线验） |
| **为什么买** | 他们的客户尽调开始问「工具调用能不能被第三方验证」；他们已经做了阻断，只缺「阻断可被验证」；他们已经做了重试，但「重试改了什么」说不清 |
| **收费** | OEM 按量授权，不印价格（守价格铁律） |
| **不做什么** | 不做标准、不做认证、不做服务、不做终端直销（v16 四条不变） |
| **新增卖点** | 「你的网关会自愈，但你说不清它自愈时改了什么 —— 我们让这件事可验证」 |

**为什么这个卖点比 v16 原来的更强：** v16 原来只说"阻断可被验证"，客户会想"我阻断得挺好，为什么要验"。加上自愈这一层之后，问题变成"**你的系统在你看不见的地方改变了授权，而且没有任何人能复核**"——这个痛点更硬，因为它是真实存在的，且客户自己也知道。

---

## 九、30 天最小落地（可验证，不注水）

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

## 十、命名

| 层 | 名字 | 说明 |
|---|---|---|
| **品类** | **Evidence-Carrying Runtime (ECR)** | 对外统一叫这个。中文「带证运行时」 |
| **标准** | CCS（Correctover Conformance Shape） | 不变，ECR 是 CCS 的运行时形态 |
| **产品** | Receipt SDK + Public Verifier | 不变，v16 两件 |
| **参考实现** | **NeuralBridge** | 名字保留，但定位改为「ECR 的参考实现」，不是产品 |
| **对外钩子** | *the runtime that signs its own recovery* | 一句话，可放 README 首屏 |

**为什么品类叫 ECR 而不是 "NeuralBridge 2.0"：** 品类名要能被别人引用。别人不会说"我做了个 NeuralBridge"，但会说"我们实现了 ECR 的 recovery receipt"。**品类名是给同行用的，产品名是给自己用的。**

**"flight recorder" 保留为叙事入口**（开发者一听就懂），ECR 作为正式品类名（采购和标准场合用）。

---

## 附：这份文档的事实来源

| 主张 | 来源 | 状态 |
|---|---|---|
| `RecoveryAction` 8 值 / `RecoveryLevel` 4 级 / `PhaseRecord` | `legacy/dist/types.d.ts` 实际读取 | ✅ 已实测 |
| MAPE-K 三层架构（L1 Diagnoser / HA Layer / L4 Flywheel） | `legacy/dist/engine.d.ts` 注释原文 | ✅ 已实测 |
| CircuitBreaker 三态 closed/open/half_open | `legacy/dist/circuit-breaker.d.ts` | ✅ 已实测 |
| gateway v0.1 零依赖 / 一行启动 / 四步机制 | `DSHCorrectover/neuralbridge` README | ✅ 已实测 |
| 7 条 tool-binding 向量 + verify.py 零分歧 | PR #12 三个 commit，远端 clone 实跑 | ✅ 已实测 |
| `args_digest = SHA-256(JCS(args))` 管道 | gateway README 逐字 | ✅ 已实测 |
| 三支柱对应现有资产 | 上表逐条 | ✅ 已实测 |
| 竞品三个世界划分 | 公开产品定位 | ⚠️ 强推断，未逐家实测功能边界 |
| 「没有人在做三件事同一层」 | 目前未见同类产品 | ⚠️ 待验证（D11–D20 触达时顺带核实） |

---

**下一步由主人拍两件事：**
1. 品类名 **ECR / Evidence-Carrying Runtime** 是否就用这个（要换现在说，越往后越贵）
2. 是否立刻做 D1 的 `recovery-receipt.mjs` 原型（我按上面 schema 写，今天能跑）
