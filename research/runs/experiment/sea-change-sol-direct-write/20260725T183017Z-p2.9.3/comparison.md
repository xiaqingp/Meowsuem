# 《海变》Sol Direct Write 成本对照

| 指标 | 旧流程 | Sol 直写 |
| --- | ---: | ---: |
| 模型 | Sol Medium | Sol Medium |
| 触及本作的模型调用 | 2（其中 research 与 9 件共享） | 2 |
| Research token | 190,910 / 10 件；均摊 19,091 | 不适用 |
| Author token | 34,079 | 不适用 |
| 可比总 token | 53,170（研究均摊 + author） | 54,991（成功调用） |
| Research Card | 有 | 无 |
| Writing Plan | 有 | 无 |
| Draft bytes | 4461 | 2987 |
| Evidence bytes | 6656 | 5410 |
| 搜索次数 | unavailable | 1 |
| 可比运行时长 | 142.1 秒 | 89.6 秒 |
| 机械验证 | passed | passed |

旧 research 是一次覆盖 10 件作品的真实调用；把 190,910 tokens 全部算给《海变》会夸大旧流程成本，因此节省率以 19,091 tokens 的均摊研究成本加 34,079 tokens 的独立 author 成本计算。完整批次数字仍原样保留。

本次实验第一次调用因 CLI 将 sandbox 降为 read-only 而无法落盘，属于基础设施输出失败；若发生过该失败，实际实验总成本另记为 99,597 tokens，不把它伪装成稳态 direct-write 成本。
