# 前端

`classic/` 与 `fashion/` 分别维护 React 页面。共用依赖与锁文件放在当前目录；素材和结果由各自的 `LLM-show-*` 项目提供。

完整交互页面需要本地 `LLM-show-classic/ai-workspace/runtime/` 和 `LLM-show-fashion/ai-workspace/runtime/`。这两个目录不入库，克隆仓库后须另备运行资源；最新冻结结果可在各项目的 `results/newest/` 查看。

```powershell
cd D:\LLM-show\frontend
npm ci
npm run dev:classic
# 另一个终端启动 Fashion
npm run dev:fashion
```

- Classic：`http://127.0.0.1:5173/`；原生审阅使用 `?review=1`。
- Fashion：`http://127.0.0.1:6187/`；原生素材浏览页在 `fashion/native/index.html`，也可离线打开。
- `workspace-files.mjs` 直接提供实际项目路径下的文档与冻结素材；不依赖文件系统链接或旧路径重定向。
- 构建分别在本目录运行 `npm run build:classic`、`npm run build:fashion`。构建产物放在各自 `dist/`，不入库。
