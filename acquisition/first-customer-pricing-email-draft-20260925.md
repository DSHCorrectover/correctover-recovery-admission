# 首客报价邮件（草稿 · 呈批后再发）

> 状态：**草稿，未发送**。对外邮件铁律——VC/商业邮件先呈主人批准。
> 定价纪律：月最低 + 受保护 token 计量 + 阶梯；公开页不印价；单价仅 1 对 1 邮件。
> ⚠️ 标 `[ ]` 的数字需主人按客户预估用量最终确认，勿凭空填。

---

## 英文邮件正文

**Subject:** Attest — protected-agent pricing and onboarding for [Customer]

Hi [Name],

Following our conversation, here is how Attest would be priced and delivered for your team.

**What you are paying for.** Attest is an independent, key-holding verification layer that sits in front of your agents. Every message entering or leaving is checked — identity, provenance/taint, declared intent, and signed capability for sensitive actions — and every verdict is sealed into a receipt you can verify offline, without trusting our service being online.

**1. Metered basis — protected agent traffic.** You are billed on the volume of agent traffic (tokens) that flows through and is protected by Attest, not on compute we consume. This maps directly to the token usage you already track for your models: as your agent activity grows, protection covers it.

**2. Monthly minimum.** A monthly minimum commitment of **USD 2,500**, which includes a base allowance of protected traffic [  tokens / month ]. Usage below the allowance still meets the minimum; this gives us a shared basis to operate and support the integration.

**3. Tiered rate above the allowance.**

| Monthly protected volume | Rate per 1K protected tokens |
|---|---|
| Up to [ allowance ] | Included in minimum |
| [ tier 1 ] | [ rate 1 ] |
| [ tier 2 ] | [ rate 2 ] |
| [ tier 3 ] | [ rate 3 ] |

Rates decrease as volume increases. Final tiers are set against your expected monthly volume.

**4. Verifiable metering.** Your monthly usage is not a number only we control — each count is backed by the same signed receipts issued during verification. You can independently reconcile the billed volume against those receipts, so there is nothing to take on trust about billing itself.

**5. Engagement shape.**
- Deployment: gateway/sidecar in your environment, or a dedicated endpoint under a domain you are given (not a shared sandbox).
- Onboarding: integration and first policies, with a shadow period before enforcement.
- Terms: [ monthly / annual ], 30-day written notice, standard data-protection terms.
- Support: [ SLA target, e.g. business-hour response; define in agreement ].

If this structure works, we will confirm the tier levels against your expected volume and send the ordering paperwork. Happy to walk through any part asynchronously over email.

Best regards,
Guigui Wang
Correctover — AI Reliability
wangguigui@correctover.com

---

## 内部备注（不对外）

- 月最低 USD 2,500 = 首客破零目标，包住。
- 计量基数=**被保护的 agent 流经 token**，不是引擎消耗；receipt 背书可核账。
- 抗降价：token 做底座不靠单价，靠流量规模 + 月最低。
- 交付前两件硬前置：①自有干净域名（脱离 fcapp.run 共享池，微信/浏览器才不拦）②SLA 与数据条款定稿。
- 单价档位必须有真实用量依据再填，禁止编数。
