# AI SHOW · default 底板 SVG 换装室

当前默认加载 **classic SVG v2**：四套 AI 娘以原 QQ 秀 default 为底板，保持原脸、双臂、双腿、站姿与 140×226 坐标。资源是可编辑的纯路径 SVG；前端展示原生尺寸栅格化 PNG，以保持旧素材的像素密度。

本次 v2.1 按 ZipZipPipe 标准正常比例立绘进一步补回长发、长袖、开衩/层叠长裙与标志配饰；GPT 发、角、翼、尾、衣裙统一使用同一份珍珠白、淡银紫与银色调色板。标准立绘与 QQ 秀适配并排图位于 previews/classic/standard-reference-comparison.png。

![default 与四套形象](previews/classic/default-and-four-plain.png)

## 打开

本地生产预览：<http://127.0.0.1:4173/>。服务关闭后，在本目录运行：

```powershell
npm ci
npm run dev
```

打包与预览：

```powershell
npm run build
npm run preview -- --port 4173
```

前端不依赖外部字体、图像服务、登录或后端；dist 可由静态 HTTP 服务器托管，不能直接双击 HTML 文件运行。

## 当前功能

- GPT、DeepSeek、Claude、Grok 四套预设，11 个换装槽；44 件角色单品及 5 件原 default 单品，共 49 件。
- 发型前后层一起更换，上装、裙、鞋袜、脸、配饰各自替换；原版 default 单品可与新部件混穿。
- 与 default 同尺寸并排对照，一键穿回原版 default。
- 搜索、角色筛选、随机、撤销、重置、浏览器自动保存与收藏。
- 下载带背景/透明底 PNG、搭配 JSON，以及可编辑的组合 SVG。
- v2 使用独立存储键，保留上一版浏览器收藏。

## 编辑与资源

| 路径 | 内容 |
| --- | --- |
| public/assets-classic/ | 当前全部 SVG、PNG、清单和对照图 |
| tools/classic-hair.mjs | 原发型描摹、色阶与头饰 |
| tools/classic-clothes.mjs | 原底模上的新服装、裙褶、鞋袜和色板 |
| tools/classic-theme.mjs | GPT 发、角、翼、尾与服装的共享色板 |
| tools/build-classic.mjs | 道具、背饰、清单、PNG 输出、合成预览 |
| tools/pixel-svg.mjs | 原像素转可编辑 RGBA 色块路径，无嵌入位图 |
| src/main.jsx / src/styles.css | React 界面 |
| previews/classic/ | 原型对照、整套、混穿与验证产物 |
| CLASSIC_SVG_NOTES.md | 坐标、制作方法、修改与重新生成说明 |
| ATTRIBUTION.md | 原角色、参考图和旧 QQ 秀像素资源来源 |

修改生成脚本后，运行 npm run assets:classic 再 npm run build。直接编辑单件 SVG 后，运行 npm run assets:rasterize 更新展示 PNG，再 npm run build；不需要重跑生成器覆盖手工修改。发型编辑前发/后发两个 SVG。

default 原五层经分层重组后的运行时合成逐像素差异为 0，记录在 previews/classic/base-invariant.json。SVG 渲染器会对少量半透明边缘进行预乘舍入，因此脸的运行时 PNG 保留原件，SVG 另存原 RGBA 路径；不宣称二者的文件字节或渲染器结果完全相同。

旧 public/assets、source-art、ASSET_NOTES.md 与早期预览保留为 v1 历史，前端不再默认使用。所有作品为非官方同人；旧像素素材的权利条件不因转成 SVG 而改变。具体来源与许可边界见 ATTRIBUTION.md。
