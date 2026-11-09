# AI SHOW · default 底板 SVG 换装室

当前默认加载 **classic SVG v2**：七套 AI 娘以原 QQ 秀 default 为底板，沿用双臂、双腿、站姿与 140×226 坐标。本轮修正七家神态：完整重画眼形，以连续虹膜、中央瞳孔和同向单高光取代旧眼上的零散覆色，并降低眉位；脸型、透明度、耳、鼻和下巴保持原样，穿搭沿用现有七套造型。资源是可编辑的纯路径 SVG；前端展示原生尺寸栅格化 PNG，以保持旧素材的像素密度。

本次 v2.1 按 ZipZipPipe 标准正常比例立绘进一步补回长发、长袖、开衩/层叠长裙与标志配饰；GPT 发、角、翼、尾、衣裙统一使用同一份珍珠白、淡银紫与银色调色板。标准立绘与 QQ 秀适配并排图位于 previews/classic/standard-reference-comparison.png。

在已有四套基础上新增千问「青岚问扇」、Gemini「星虹猫语」和 GLM「墨铃梦狐」，分别保留标准立绘的中式长袍与折扇、渐变猫耳猫尾与异色瞳、黑白狐耳长裙与 Z 纹书。三套单独的标准参考对照图位于 previews/classic/new-three-standard-reference.png。

七家表情优先采用用户明确的人设：DeepSeek 是“爱吃白饭的大肥鱼”，使用蓝紫渐水蓝瞳、满足鼓腮和嘴角米粒；Claude 是“家教很严的温婉大小姐”，保留低饱和茶金瞳，放松眉眼，使用自然平口，减去明显笑弧；GLM 是“犯困的贪睡虫”，保留灰紫半睁眼与松弛眉，去掉哈欠，改为自然闭口。瞳色参考 ZipZipPipe 标准正常比例人设图作目视归纳，不宣称精准取色。其余表情结合本地 AI Girls Atlas 原创草案与原画，是本项目同人演绎，不代表品牌或视觉原作者的官方性格。

当前表情名为 GPT「淡紫温和微笑」、DeepSeek「蓝瞳馋饭鼓腮」、Claude「茶金舒缓静容」、Grok「碧蓝自信浅笑」、千问「紫瞳端庄浅笑」、Gemini「玫金灵动猫笑」、GLM「灰紫困倦闭口」。Claude 与 GLM 本轮局部调整的预览位于 `previews/classic/claude-glm-softened.png`。

![default 与七套形象](previews/classic/default-and-seven-plain.png)

## 打开

本轮开发预览：<http://127.0.0.1:5173/>。服务关闭后，在本目录运行：

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

- GPT、DeepSeek、Claude、Grok、千问、Gemini、GLM 七套预设，11 个换装槽（含背饰）；77 件角色单品及 5 件原 default 单品，共 82 件。
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
| tools/classic-additions.mjs | 千问、Gemini、GLM 的角色配置、背饰、道具与背景 |
| tools/classic-faces.mjs | 七家表情方向、原脸皮肤处理、独立眉眼嘴图层与表情对照 |
| tools/build-classic.mjs | 道具、背饰、清单、PNG 输出、合成预览 |
| tools/pixel-svg.mjs | 原像素转可编辑 RGBA 色块路径，无嵌入位图 |
| src/main.jsx / src/styles.css | React 界面 |
| previews/classic/ | 原型对照、整套、混穿与验证产物 |
| CLASSIC_SVG_NOTES.md | 坐标、制作方法、修改与重新生成说明 |
| ATTRIBUTION.md | 原角色、参考图和旧 QQ 秀像素资源来源 |

修改生成脚本后，运行 npm run assets:classic 再 npm run build。直接编辑单件 SVG 后，运行 npm run assets:rasterize 更新展示 PNG，再 npm run build；不需要重跑生成器覆盖手工修改。发型编辑前发/后发两个 SVG。

default 原五层经分层重组后的运行时合成逐像素差异为 0，记录在 previews/classic/base-invariant.json。原 default 脸保持原件；七家特化脸保留原透明边缘，设计源 `face-design.svg` 将皮肤与可编辑眉、瞳、嘴分开，运行时仍使用 `face.svg` / `face.png`。SVG 渲染器可能对少量半透明边缘进行预乘舍入，不宣称 PNG 与 SVG 渲染结果完全相同。

此前新增三套阶段已运行 npm run assets:classic 并完成静态语法检查，查看过原生尺寸、整数倍放大、浅深底及标准参考对照；当时原有四套与 base 资源哈希和新增前一致。这是表情特化前的历史检查，不表示本轮七家脸部资源仍与旧版相同。

首轮表情特化前的原图备份位于 `previews/classic/expression-before/`；本轮神态修正前的版本另备份于 `expression-revision-before/`。重点三家预览为 `focus-three-expressions.png`，本轮前后对照为 `expression-revision-comparison.png`；七家浅深底和头发合成预览为 `seven-expressions-light.png`、`seven-expressions-dark.png` 与 `seven-expression-heads.png`。资产生成使用 `npm run assets:classic`，检查范围为脚本静态语法、原生尺寸、浅深底与头发合成；没有新增测试代码或 GIF 动画，未执行生产构建或完整 UI 回归。三套整身预览仍为 `new-three-native.png`、`new-three-light.png`、`new-three-dark.png`，完整场景为 `default-and-seven-scenes.png`。

旧 public/assets、source-art、ASSET_NOTES.md 与早期预览保留为 v1 历史，前端不再默认使用。所有作品为非官方同人；旧像素素材的权利条件不因转成 SVG 而改变。具体来源与许可边界见 ATTRIBUTION.md。
