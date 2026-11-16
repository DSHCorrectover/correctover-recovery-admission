# ECR — Evidence-Carrying Runtime（执行面）

> the runtime that signs its own recovery.

**品类词汇表（8 reason codes）**: `unresolved-failure-ref` / `recovery-replay` / `param-widening` / `capability-downgrade` / `execution-set-change` / `subject-drift` / `unapproved-path` / `authority-unchanged`

**核心命题（可被任何人跑一遍验证）**: 一条签名正确、哈希链完整、digest 可复算的恢复收据，在 8 个真实场景里有 7 个仍然代表一次未经授权的权限变更。

```bash
python3 verify-binding.py            # -> 8/8 PASS, 7 of 8 binding-alone
python3 verify-binding.py --tamper   # -> CAUGHT
```

## 与 RA 576 套件的关系（双面定位，对外永远成对出现）

| | ECR（本目录） | RA（仓库根） |
|---|---|---|
| 回答 | 这次恢复**改变了什么** | 这次恢复**该不该放行** |
| 词汇 | 8 码=品类状态码级 | 576 码=判例法级（穷举 6 维） |
| 层 | 执行面：收据生成与绑定验证 | 验证面：判定语义可反驳 |

- 映射契约见 [`CROSSWALK-ECR-RA.md`](../CROSSWALK-ECR-RA.md)（PROVISIONAL——冻结条件：独立重放五项全过，见 ecr/d1-original/README 验收条款）
- 矛盾矩阵 = 反例引擎：任何 ECR/RA 组合落在允许对之外即按 VERIFIED_BY.md 署名上报
- 新增 ECR 码必须先在 RA suite 有对应锚，否则对外不可引用

---
*Provenance: semantics declared by D1 (2026-11-16) on the cloud-side session; independently rebuilt and verified on this side (8/8 PASS + 7-of-8 binding-alone + tamper CAUGHT + residue zero). Dual-implementation conformance is the standing verification standard.*
