# M28.9 通用零模型整馆收尾

日期：2026-07-24  
Pipeline：2.6.0  
测试馆：维也纳艺术史博物馆（40 项）、地中美术馆（20 项）

## 结果

- 两馆使用同一个 `scripts/assemble-museum-candidate.mjs`，不再执行馆专用 builder。
- 装配器只读取 `assembly-input.json`、已经通过的 author bundles 和现有前端数据文件；没有研究、写作、图片搜索或模型调用。
- 自动测试逐字段比较候选与正式馆对象，并比较标准化后的逐件正文；两馆均语义等价。
- 两馆均通过 15 馆、500 项、608 个唯一页面 URL 的全站本地结构门。
- 第一次完整联网门通过：维也纳 41/41 图片、43/43 来源；地中 15 个唯一图片和 12 个唯一来源中没有真实损坏，5 个 Wikimedia 图片请求被 429 限流并按 host-blocked 处理。
- 随后的维也纳重复联网检查遇到 3 个 KHM 页面超时；此前同 URL 已在本轮成功，故记录为外部主机波动，不改内容、不调用模型补救，也不覆盖成功报告。
- 两馆发布均为 dry-run，没有修改 8094 正式内容。

## 用时与 Token

| 馆 | 通用组装 | 联网与全站验证 | 发布 dry-run | 总计 | 模型调用 | 模型 Token |
|---|---:|---:|---:|---:|---:|---:|
| 维也纳 | 0.109 秒 | 5.427 秒 | 0.086 秒 | 5.624 秒 | 0 | 0 |
| 地中 | 0.103 秒 | 16.713 秒 | 0.079 秒 | 16.896 秒 | 0 | 0 |

外部网站响应决定联网门耗时，装配和发布本身均低于 0.11 秒。

## 结论

`assembly-input.json` 现在是内容阶段与网站装配的明确边界。正常整馆收尾固定为：

```text
assembly-input + passed author bundles
  -> generic assembly
  -> whole-site local structure + current-museum live resources
  -> publication dry-run / publish
  -> finalization-report.json
```

这条路径不需要模型。若身份、评分、正文、图片或来源缺失，必须退回对应上游阶段，装配器不会猜测。
