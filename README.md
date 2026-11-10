# LLM Show

Classic 与 Fashion 两套 QQ 秀的前端源码、原生素材、最新冻结结果和评分规则。

| 内容 | Classic | Fashion |
| --- | --- | --- |
| 最新七人预览 | [preview.png](LLM-show-classic/preview.png) | [preview.png](LLM-show-fashion/preview.png) |
| 最新结果与逐人评分 | [newest](LLM-show-classic/results/newest/index.html) | [newest](LLM-show-fashion/results/newest/index.html) |
| 评分规则 | [rating-rules](LLM-show-classic/rating-rules/README.md) | [rating-rules](LLM-show-fashion/rating-rules/README.md) |
| 前端源码 | [frontend/classic](frontend/classic/README.md) | [frontend/fashion](frontend/fashion/README.md) |
| 原生素材 | [qq-show-classic](qq-show-classic/README.md) | [qq-show-fashion](qq-show-fashion/README.md) |

```text
frontend/                  共用依赖及 Classic / Fashion 前端
qq-show-classic/            Classic 原生素材
qq-show-fashion/            Fashion 原生 SWF、导出素材及来源清单
LLM-show-classic/
  preview.png              最新七人预览
  rating-rules/            评分与验收规则
  results/newest/          最新冻结结果、源码及评分证据
LLM-show-fashion/
  preview.png              最新七人预览
  rating-rules/            评分与验收规则
  results/newest/          最新冻结结果、源码及评分证据
```

两个项目只提交 `results/newest/`、`rating-rules/` 和 `preview.png`。`new`、`previous`、归档、生成工具、`ai-workspace`、原始人设参考和根目录本地导航均保留在本地，由 `.gitignore` 排除。最新冻结结果中的源码和证据按原目录完整保留；评分及待审状态不因提交而改变。部分历史溯源链接指向本地材料，克隆后不可用。

前端在 `frontend` 执行 `npm ci`，再运行 `npm run dev:classic`（5173）或 `npm run dev:fashion`（6187）。交互页面仍依赖本地 `LLM-show-classic/ai-workspace/runtime/` 和 `LLM-show-fashion/ai-workspace/runtime/`；运行资源不在本次提交范围内，完整交互预览需要另备这两个目录。仓库内的 `preview.png` 和最新冻结结果可直接查看。

根目录 [LICENSE](LICENSE) 的 MIT 授权仅覆盖原创通用前端代码，不涵盖第三方素材、字体、角色设计、商标、引文及派生美术；它们的来源和权利声明仍分别适用。
