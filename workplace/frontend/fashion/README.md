# Fashion 前端

在 `D:\LLM-show\workplace\frontend` 执行 `npm ci`，然后运行 `npm run dev:fashion`。打开 `http://127.0.0.1:6187/`。

- `src/`：React 页面、样式与前端组合模型。
- `vite.config.mjs`：本页面配置；运行资产直接读取 `../../LLM-show-fashion/ai-workspace/runtime/`。
- 结果与评分：`../../LLM-show-fashion/results/`。
- 打分细则：`../../LLM-show-fashion/rating-rules/`。
- `native/index.html`：原生 Fashion 素材浏览页，可离线打开。

`ai-workspace/runtime/` 与生成工具 `tools/` 仅保留在本地，不入库。克隆仓库后须另备运行资源才能使用完整交互页面；已提交的冻结结果位于 `../../LLM-show-fashion/results/newest/`。
