# Anchorage Museum M15 构建记录（v1.4.0）

日期：2026-07-20

## 范围与评分

- 只覆盖 625 C Street 主馆；不并入 Alaska 其他博物馆。
- Smithsonian Arctic Studies Center 的 600 多件对象明确写为长期借展，不并入馆方馆藏数字。
- 评分 79：强项是 Art of the North、Alaska Exhibition 与 Indigenous knowledge 的综合解释；未找到足以支持 80 档的稀世珍品组。

## 内容与图片

- 20 件、5 章；90 分钟 8 件、半天 15 件、完整库 18 件可见候选 + 2 件仅阅读轮换对象。
- 20 篇均有 30 秒层、细看层、至少 4 个现场细节、最后一眼、事实边界和馆方来源。
- 名家 / 已知艺术家作品有作品相关的作者风格；文化对象优先写材料技术、作者 / 社区、转赠链和可见边界。
- 图片全部来自 Anchorage Museum 官方页面；图片说明链接回对应馆方资源，不以相似对象冒充。

## 自动与浏览器门

- `verify-content-quality --strict`：330/330，0 failures。
- 结构门：9 馆、330 项、59 章、399 个唯一页面地址。
- 浏览器：封面正常；逐段触发 20 张 lazy-load 卡片图，20/20 `naturalWidth > 0`；`gut-cape` 深链打开正确作品并显示三层正文；首页 9 个地图标记与 Anchorage 排名入口存在；控制台无 error / warning。

## 未关闭

- manifest 保持 `in_audit`；人工声音验收与事实 / 比较接受等待用户审阅，不以自动门替代。
