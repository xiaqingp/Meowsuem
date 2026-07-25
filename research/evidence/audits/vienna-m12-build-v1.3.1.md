# M12 维也纳艺术史博物馆构建记录

日期：2026-07-20  
内容标准：`research/meowseum-content-instruction.md` v1.3.1

## 已完成

- 范围限定为玛丽亚·特蕾西亚广场主楼，不并入帝国宝库、马车博物馆或阿姆布拉斯城堡。
- 40 件：32 件主线、8 件“冷门但值得”；覆盖绘画、Kunstkammer、古罗马与古埃及。
- 8 章、90 分钟 / 半天 / 完整三档路线；每件作品有独立 `museum.html?id=vienna&work=<id>` 地址。
- 评分 96，与其他五馆在 2026-07-20 同批校准。
- `node scripts/verify-content-quality.mjs`：230/230，0 failures。
- `node scripts/verify-three-museums.mjs`：六馆容量、章节、路线与校准通过。
- `node scripts/verify-release-candidate.mjs`：6 馆、230 件、276 个唯一页面地址，通过。
- 浏览器：首页 6 个地图标记、维也纳排名第 3；维也纳 40/40 卡片图像实际加载宽度大于 0；《雪中猎人》深链、960px 图片与三层正文通过。

## 尚待用户审阅

- 40 篇已达到自动结构门，但“人工声音审计”和逐条事实 / 最近比较对象复核仍保持待审，不用自动门冒充最终编辑验收。
- 用户审阅后若调整选品、讲述密度或评分，再完成最终合规状态。
