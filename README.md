# LLM Show

QQ秀版本的LLM娘化形象，采用zipzippipe的娘化形象

## 运行

在 LLM-chan-asset 内执行 npm ci 和 npm run dev；npm run build 生成前端构建。

此公开仓库是代码与文本规则版本，未包含人物图片、旧 QQ 秀素材、字体或生成的派生图像。启动前须自行取得合法授权的素材，并将符合现有清单契约的资源放入 LLM-chan-asset/public/assets-classic/manifest.json 及其引用路径。缺少素材时页面会显示加载失败与重试，不代表素材已经随开源代码授权。

已有合法本地素材的开发者可参考 LLM-chan-asset/CLASSIC_SVG_NOTES.md 与生成工具；生成器依赖未分发的本地输入，并非开箱即用的在线图像服务。安装生成工具依赖：npm ci --prefix LLM-chan-asset/tools/.deps。

## 开源与素材边界

通用前端、通用像素转换与栅格化工具按 LICENSE 的 MIT 许可提供。角色造型生成脚本、第三方设计规则中的引文/参考及第三方角色权利不在该许可授权范围内；详见 COMPLIANCE.md 与原有署名文件。

ai-girls-atlas、qq-show-classic、所有生成图片/SVG、截图、字体、资源压缩包、依赖目录与构建产物均不提交。转成 SVG、AI 重绘或添加署名不自动产生对原素材的再分发权利。
