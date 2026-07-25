# M28.10 未来新馆唯一接入合同

日期：2026-07-24  
Pipeline：2.6.1  
内容与线上变更：无  
模型调用：0  
模型 token：0

## 结果

- Manifest 中现有 15 馆被明确冻结为 legacy baseline，本次不迁移、不改正文、不改 8094。
- 未来馆只能由通用装配器输出 `museumData.<id>`；馆 ID、地图坐标、两页脚本顺序、首页地图与排名注册、发布文件清单均由机械门校验。
- `finalize-museum.mjs` 固定按 `assembly -> future-contract -> release verification -> publication` 执行，未来馆不能绕过合同进入发布。
- 发布候选验证器会从 `publication.json` 发现未来馆数据文件，不再把全站馆数硬编码为 15。

## 测试证据

- 正向集成 fixture：真实调用通用装配器生成 1 件作品的 `futuretest` 馆，合同通过。
- 负向 fixture：额外 binding、错误脚本顺序、缺少地图注册、馆专用 `build-candidate.mjs` 均被拒绝。
- 既有馆回归：维也纳 40 件、地中 20 件候选与正式数据语义一致。
- 发布门回归：维也纳与地中均保持全站 15 馆、500 项、608 个唯一 URL。
- `verify-project-authority`、`verify-pipeline-causality`、`verify-content-pipeline`、publisher self-test、14 项评分门 fixture 全部通过。
- 维也纳标准收尾 dry-run 完整经过 assembly、future-contract（legacy exempt）、release verification 和 publication dry-run；总计 0.350 秒，模型调用 0、模型 token 0。
- Pipeline 2.6.1 成功冻结，并再次运行冻结器验证幂等。
