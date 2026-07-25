# M18 地中美术馆构建审计（v1.5.0）

日期：2026-07-21

## 范围

- 只覆盖直岛地中美术馆（Chichu Art Museum）。
- 不把 Benesse House Museum、李禹焕美术馆、直岛新美术馆或家计划并入评分、选品与路线。
- 20 项由九件永久作品、整馆体验、可独立观察的建筑节点、莫奈展室工艺与地中庭园组成；没有把同一对象换名拆分凑数。

## 评分结论

评分为 92，位于 90 档下段上沿。

- 专程旅行检验：即使拿掉直岛其他艺术场馆，只为地中美术馆安排一次上岛旅行仍然成立。
- 珍品线一：五幅莫奈晚年《睡莲》与为其定制的自然光白房间形成不可替代的永久组合。
- 珍品线二：James Turrell 的《Afrum, Pale Blue》《Open Field》《Open Sky》把早期投影、可进入光场与 Skyspace 串成永久生涯序列。
- 珍品线三：Walter De Maria 的《Time/Timeless/No Time》只能在球体、台阶、27 件金色形体与天光共同设计的房间中成立。
- 安藤忠雄建筑作为整体场域只计算一次；没有用建筑、海岛旅行或直岛其他场馆重复加分。
- 馆内只有三位艺术家的九件永久作品，容量、媒介跨度与重复参观内容小于维也纳 96 分及三座 98 分巨型馆，因此不进入 90 档中上段。

## 内容与图片边界

- 正文按唯一指令 `research/meowseum-content-instruction.md` v1.5.0 编写，共 20 项、5 章、三档路线。
- 每项均有 30 秒总述、按对象定制的深入标题与观察点、结尾回看、事实边界和来源。
- 关键单件采用可核对的精确作品图：莫奈 1915–1926 年《Water-Lily Pond》、Turrell 三件作品、De Maria 场域作品。
- 其余四幅莫奈卡片使用馆方莫奈作品组 / 展室图，并在图片说明中明确不是每幅作品的独立正面图，不伪称单件图。
- 浏览器发现 Wikimedia 的 `1200px` 缩略图规格不能加载，已改为同一文件的可用 `1280px` 精确图并复验为 1280 × 419。

## 自动门

- `verify-content-quality.mjs --strict`：380 / 380，0 failures。
- `verify-three-museums.mjs`：11 馆结构、评分、路线与地图坐标通过。
- `verify-release-candidate.mjs`：11 馆、380 项、70 章、462 个唯一页面地址、360 个唯一图片、425 个唯一来源页。
- 全量外链检查：图片 259 / 360 可直接访问、101 个 host-blocked、0 broken；来源页 273 / 425 可直接访问、152 个 host-blocked、0 broken；release candidate gate passed。

## 真实浏览器门

- 馆页显示 92 分、评分证据、5 章、20 项和三档路线。
- 完整路线切换后 URL 为 `route=all` 且显示 20 张卡片；单件点击生成稳定 `work=whole` 深链。
- 抽查《Water-Lily Pond》《Afrum, Pale Blue》《Open Field》《Open Sky》《Time/Timeless/No Time》；双层正文、来源和独立 URL 存在，修复后五张主图均成功加载。
- 首页显示 11 个地图标记；地中美术馆以 92 分排在维也纳艺术史博物馆之后、Getty Center 之前。

## 剩余完成门

- 自动、事实、图片和浏览器门已通过；`humanVoiceAudit` 仍为 `pending_owner_review`。
- M18 在 owner 明确接受内容前保持 `Implemented; Pending Owner Acceptance`，不关闭。
