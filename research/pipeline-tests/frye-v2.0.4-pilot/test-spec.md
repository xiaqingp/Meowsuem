# M28 Frye 20 件整馆因果试点

> Run ID: `m28-frye-v2.0.5-pilot-2026-07-22`  
> Content: 1.7.0  
> Pipeline: 2.0.6  
> Status: locked before research

## Scope and stop rule

- 只覆盖 Frye Art Museum, 704 Terry Avenue；临展借展不进入评分或稳定 20 件。
- 沿用 owner 已接受的 72 分与 20 件容量，本测试不重新打开评分问题。
- 两批各最多十件准备研究卡；卡片、详情、作者自审与独立审读逐件封存，上一件正文不得成为下一件输入。
- 作者与独立 reviewer 均显式使用 `gpt-5.6-sol`、`reasoning effort: medium`；隐式默认或不一致的产物不计入通过证据。
- 写作计划必须建立研究卡到所有正文断言的 `claimLedger`；计划和正文不得新增视觉排序、事实、比较或论点，只能重组并通俗解释已有证据。
- 旧 Frye 正文只能在新稿封存后供 reviewer 查漏和质量比较，不能进入作者输入。
- 20 件全部通过前不写正式 `research/frye-content-v1.md`，不更新前端数据。
- 任何一件失败只退回该件；共同缺陷先升级共享规则再按影响重测。

## Artifact chain per work

`batch source-pack -> research-card.md -> writing-plan.json -> card.txt -> draft.md -> author-review.json -> independent-review.json`

每个下游记录直接上游文件名与实际 SHA-256。研究卡只含事实、比较、观察、来源、不确定性和图片 / 在展边界；不得含可发布正文。

## Shared acceptance

- 完整元数据、独立卡片、双层详情、至少四个现场可核对细节、对象专属最后一眼、事实边界和可点击来源。
- `card.txt` 只含简介正文，不拼作者 / 国家元数据；详情必须显式包含单独的材质行。
- 快层 70—240、深层至少 320、卡片 24—100 个可见字符只是机械边界，不替代编辑判断。
- 深层围绕一个问题逐段推进；历史、风格、重要性不能成为可交换栏目。
- 重要性完成五维判断和最近比较对象；Frye 的 72 分边界禁止把重要藏品夸成决定行程的稀世珍品。
- 自然中文、无翻译腔、无凭空纠正、无心理偷写、无观看顺序冒充历史先后、无固定“先看 / 再看”或“不是 / 而是”模板。
- 访客正文不得出现研究缺口、图片许可、发布待办、测试、prompt、生成器、reviewer 或版本迁移等内部生产语言。
- 独立 reviewer 才能签发最终 PASS；七项 voice 至少 12/14 且无 0 分。

## Museum-level gate after 20 works

- 新写馆介、五章与 8 / 15 / 20 三档路线；不得复用旧正文。
- 20 个卡片、快层和结尾做全馆连续朗读与重复骨架扫描。
- 原子集成后运行结构、内容、重要性、图片、20 个 URL、深链、前进 / 后退、首页排名和真实桌面浏览器检查。
- 只有整馆全部通过才可替换正式 Frye；否则测试稿继续隔离。
