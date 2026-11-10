# LLM Show

Classic 与 Fashion 两套 QQ 秀的前端源码、原生素材、最新冻结结果和评分规则。

| 内容 | Classic | Fashion |
| --- | --- | --- |
| 最新七人预览 | [preview.png](workplace/LLM-show-classic/preview.png) | [preview.png](workplace/LLM-show-fashion/preview.png) |
| 最新结果与逐人评分 | [newest](workplace/LLM-show-classic/results/newest/index.html) | [newest](workplace/LLM-show-fashion/results/newest/index.html) |
| 评分规则 | [rating-rules](workplace/LLM-show-classic/rating-rules/README.md) | [rating-rules](workplace/LLM-show-fashion/rating-rules/README.md) |
| 前端源码 | [frontend/classic](workplace/frontend/classic/README.md) | [frontend/fashion](workplace/frontend/fashion/README.md) |
| 原生素材 | [qq-show-classic](qq-show-classic/README.md) | [qq-show-fashion](qq-show-fashion/README.md) |

```text
workplace/frontend/        共用依赖及 Classic / Fashion 前端
qq-show-classic/            Classic 原生素材
qq-show-fashion/            Fashion 原生 SWF、导出素材及来源清单
workplace/LLM-show-classic/
  preview.png              最新七人预览
  rating-rules/            评分与验收规则
  results/newest/          最新冻结结果、源码及评分证据
workplace/LLM-show-fashion/
  preview.png              最新七人预览
  rating-rules/            评分与验收规则
  results/newest/          最新冻结结果、源码及评分证据
```

两个项目只提交 `results/newest/`、`rating-rules/` 和 `preview.png`。旧版 `new`、`previous` 及过时产物已移入本地 `to delete/cleanup-20261110/files/`。生成工具、必要 `ai-workspace`、原始人设参考和根目录本地导航继续保留，由 `.gitignore` 排除。最新冻结结果中的源码和证据按原目录完整保留；评分及待审状态不因提交而改变。部分历史溯源链接指向本地材料，克隆后不可用。

前端在 `workplace/frontend` 执行 `npm ci`，再运行 `npm run dev:classic`（5173）或 `npm run dev:fashion`（6187）。交互页面仍依赖本地 `workplace/LLM-show-classic/ai-workspace/runtime/` 和 `workplace/LLM-show-fashion/ai-workspace/runtime/`；运行资源不在本次提交范围内，完整交互预览需要另备这两个目录。仓库内的 `preview.png` 和最新冻结结果可直接查看。

根目录 [LICENSE](LICENSE) 的 MIT 授权仅覆盖原创通用前端代码，不涵盖第三方素材、字体、角色设计、商标、引文及派生美术；它们的来源和权利声明仍分别适用。

下次继续优化与打分，从本地 [NEXT_ITERATION.md](NEXT_ITERATION.md) 开始。
