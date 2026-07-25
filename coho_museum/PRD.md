# PRD

## Status

- Project: Meowseum
- Owner: surreal
- Product status: released; continuing content and pipeline iteration
- Current operational state, versions and museum migration status: `research/content-standard-manifest.json`
- Historical PRD: `coho_museum/archive/PRD-through-M28.1.md`

## Product

Meowseum 是一个私人使用、中文优先、桌面优先的全球博物馆旅行网站。它回答两个问题：

1. 一座城市或地区有哪些博物馆值得去，值得到什么程度？
2. 进入一座馆后，最应该看哪些作品，为什么，现场怎样看？

产品以内容质量为核心，不追求收录所有博物馆。首页用世界地图和博物馆排名帮助做旅行决定；馆页提供馆级判断、精选内容和参观路线；作品页提供中英双语名称、重要性、作者或文化、年代、图像、快速理解与深入讲解。

## Current scope

- 私人单用户网站；不提供账号、社交、购票或实时馆内导航。
- 中文讲解；作品名称可中英双语。
- 桌面网站优先。
- 手动打卡、照片和参观记录属于后续方向，当前不实现。
- 每馆根据内容密度选择 20、30、40 或 60 项，不机械追求齐全。
- 当前正式馆与容量以 manifest 为唯一状态源；目前产品包含以下 15 个场馆：

| ID | 场馆 |
| --- | --- |
| louvre | 卢浮宫 Musée du Louvre |
| met | 大都会艺术博物馆 The Metropolitan Museum of Art |
| seattle | 西雅图艺术博物馆 Seattle Art Museum（仅 downtown 主馆） |
| glyptotek | 新嘉士伯美术馆 Ny Carlsberg Glyptotek |
| muxin | 木心美术馆 Mu Xin Art Museum |
| vienna | 维也纳艺术史博物馆 Kunsthistorisches Museum Vienna |
| enoura | 江之浦测候所 Enoura Observatory |
| british | 大英博物馆 British Museum |
| anchorage | Anchorage Museum |
| getty | Getty Center |
| chichu | 地中美术馆 Chichu Art Museum |
| egyptian | 埃及博物馆 The Egyptian Museum in Cairo（解放广场主馆） |
| alhambra | 阿尔罕布拉宫 Alhambra–Generalife |
| smk | 丹麦国立美术馆 SMK（Sølvgade 主馆） |
| frye | Frye Art Museum |

## Product requirements

### Homepage

- 一张可缩放、平移和点击的世界地图；空白地区不暗示数据完整。
- 地图下显示全部已发布博物馆排名。
- 每行整体可点击，不显示多余箭头。
- 完整展示 90+、80+、70+、60+、60 以下的旅行评分解释。

### Museum page

- 每馆有稳定、唯一 URL。
- 主卡只展示封面、名称、城市、评分档位、路线入口、官方链接和更新时间；不重复显示旅行行动、限制或左侧结论句。评分理由、声明容量和馆级主线放在下方正文。
- 提供按内容价值与现场成本策划的三档路线：90 分钟、半天、完整浏览；大型馆的完整内容库不伪装成一天任务。
- 卡片展示正确图片、作品中英名、作者或文化、国家/地区、年代、参观优先级、重要性和独立一句话简介。

### Work page

- 每件作品有稳定、唯一深链。
- 作者 / 文化、年代、地点、参观优先级、重要性和停留建议由标题区与侧栏结构化显示；讲解正文不重复拼接这些字段，并从“30 秒先懂”开始。
- 图像必须与对象正确对应，不得为了“有图”使用错误作品。
- 内容回答：最值得理解什么、为什么重要、怎样现场确认、继续停留还能看到什么。
- 事实、直接观察和编辑整理必须可追溯；不得编造作者意图、心理、稀有度或历史结论。
- 珍贵作品解释其稀有性、艺术价值和最近可比较对象；不能只写“极为罕见”。
- 著名作者适用时解释其风格怎样具体出现在这件作品上。
- 内容声音、选品、评分和研究要求以 `research/meowseum-content-instruction.md` 为唯一标准。

### Ratings and significance

- 先按稀世珍品与不可替代性定 90/80/70/60 档，再在档内微调；体验、建筑和个人偏好不能帮助跨档。
- 首页分数只读取 `ratings.js`。
- 调整任何评分时必须把所有已发布博物馆放回同一校准集合。
- 作品重要性与“值得多少现场注意力”相关但不等同；卡片同时显示两种标签。

### Content and publication

- 研究、写作和机械处理按 `research/generation-pipeline.md` 执行。
- 正式页面读取已经写好的 Markdown；运行时脚本不得生成、补写或轮换正文。
- 新馆复用统一 `museum-app.js` 渲染器、数据合同和 URL 规则。
- 不发布半完成的整馆替换；正式内容、卡片数据、图片、路线和页面必须作为同一馆一起验证。
- Owner 可在执行前明确批准既有作品的内容补丁；该通道必须从研究卡重新走完当前 pipeline，同时替换卡片与详情，并分别验证受影响馆的图片、数据、URL 和真实页面。它不能被自动化用来逐步混入未完成的整馆重生内容。

## Non-goals

- 完整馆藏数据库或学术检索工具。
- 全球所有博物馆的自动抓取。
- 实时票价、开放状态、轮换展品保证。
- GPS 验证、语音导览、作品识别和自动寻路。
- 第一版移动端完整适配。

## Acceptance

- 首页地图、排名和评分语义一致。
- 馆页与作品深链刷新可用，前进后退正常。
- 所有声明作品都有正确数据、图片和可读正文。
- 评分、馆址边界、容量、路线和内容文件与 manifest 一致。
- 自动门、相关馆浏览器检查和 owner 明确验收完成后才能替换正式馆。
