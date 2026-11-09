# AI SHOW · default 底板 SVG 换装室

当前默认加载 **classic SVG v2**：七套 AI 娘以原 QQ 秀 default 为底板，沿用双臂、双腿、站姿与 140×226 坐标。本次定稿结合联网角色资料和原版经典 QQ 秀，收细发丝、衣缘高光与裙褶纹理，补清白饭碗、双刃斧和折扇等配饰；已确认的神态与瞳色保持。资源是可编辑的纯路径 SVG；前端展示原生尺寸栅格化 PNG，以保持旧素材的像素密度。近期原作者更新的可访问范围、二创资料边界与逐家取舍见 [FINAL_DESIGN_NOTES.md](FINAL_DESIGN_NOTES.md)。

本次 v2.1 按 ZipZipPipe 标准正常比例立绘进一步补回长发、长袖、开衩/层叠长裙与标志配饰；GPT 发、角、翼、尾、衣裙统一使用同一份珍珠白、淡银紫与银色调色板。标准立绘与 QQ 秀适配并排图位于 previews/classic/standard-reference-comparison.png。

在已有四套基础上新增千问「青岚问扇」、Gemini「星虹猫语」和 GLM「墨铃梦狐」，分别保留标准立绘的中式长袍与折扇、渐变猫耳猫尾与异色瞳、黑白狐耳长裙与 Z 纹书。三套单独的标准参考对照图位于 previews/classic/new-three-standard-reference.png。

七家表情优先采用用户明确的人设：DeepSeek 是“爱吃白饭的大肥鱼”，使用蓝紫渐水蓝瞳、满足鼓腮和嘴角米粒；Claude 是“家教很严的温婉大小姐”，保留低饱和茶金瞳，放松眉眼，使用自然平口，减去明显笑弧；GLM 是“犯困的贪睡虫”，保留灰紫半睁眼与松弛眉，去掉哈欠，改为自然闭口。瞳色参考 ZipZipPipe 标准正常比例人设图作目视归纳，不宣称精准取色。其余表情结合本地 AI Girls Atlas 原创草案与原画，是本项目同人演绎，不代表品牌或视觉原作者的官方性格。

当前表情名为 GPT「淡紫温和微笑」、DeepSeek「蓝瞳馋饭鼓腮」、Claude「茶金舒缓静容」、Grok「碧蓝自信浅笑」、千问「紫瞳端庄浅笑」、Gemini「玫金灵动猫笑」、GLM「灰紫困倦闭口」。Claude 与 GLM 本轮局部调整的预览位于 `previews/classic/claude-glm-softened.png`。

七套背景按用户人设与联网材料分别重制为：GPT「云端星图书阁」、DeepSeek「海边白饭食堂」、Claude「庄园午后书房」、Grok「黑金夜城露台」、千问「江南云锦书斋」、Gemini「双子星观测台」、GLM「月夜午睡书房」。场景采用内置 `image_gen` 新绘，保留人物定稿；来源、证据边界、提示词路径与适配方法见 [BACKGROUND_NOTES.md](BACKGROUND_NOTES.md)。

![default 与七套形象](previews/classic/default-and-seven-plain.png)

## 打开

本地开发地址为 <http://127.0.0.1:5173/>，在本目录启动：

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

## PNG 与 GIF 成品

在本地参考库、背景原稿及运行时资产齐全时运行：

```powershell
npm run assets:classic
npm run assets:export
```

`deliverables/classic-final/` 内每家包含原生 140×226 场景 PNG、透明人物 PNG、420×678 最近邻预览及循环 GIF。GIF 为 8 帧、每帧 240ms、1.92 秒无限循环，仅调整既有特效透明度；人物、脸和背景保持静止。总览为 `all-seven-preview.png`，解码参数与文件 SHA-256 在 `export-report.json`。导出读取当前 PNG 分件，手工修改 SVG 后应先运行 `assets:rasterize`。

需要场景也动时，再运行 `npm run assets:animate-scenes`。`deliverables/classic-animated-scenes/` 提供七家独立背景 GIF、人物与动态场景合成 GIF、3 倍 GIF 预览与静态代表帧；总览为 `all-seven-animated.gif`。这一版为 20 帧、每帧 160ms、3.2 秒循环，热气、云丝、灯火、星轨、竹影和花瓣按场景局部运动，人物画层及镜头固定。逐家动效与实际解码记录见 `BACKGROUND_NOTES.md` 和成品内的 `animation-report.json`。

生成器同时输出运行时 `background.gif`，给清单添加可选 `animatedSrc`。换装室场景层播放动图，系统偏好减少动态时使用静态 PNG；物品缩略图、PNG/SVG 导出与导出预览仍使用静态资源。重新生成或手工修改背景 SVG 后，需要再次执行 `assets:animate-scenes`，避免使用旧动图。

图像、GIF、原稿、参考库和资源压缩包依照现有发布范围保留在本地；仓库提交代码、来源与文字说明。下载代码本身不包含完整美术资源，详见根目录 `COMPLIANCE.md`。

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
| tools/classic-additions.mjs | 千问、Gemini、GLM 的角色配置、背饰与道具 |
| tools/classic-faces.mjs | 七家表情方向、原脸皮肤处理、独立眉眼嘴图层与表情对照 |
| tools/classic-backgrounds.mjs | 七套新背景主题、原稿适配、纯路径输出与背景预览 |
| tools/build-classic.mjs | 道具、背饰、清单、PNG 输出、合成预览 |
| tools/export-classic.mjs | 场景/透明 PNG、最近邻预览、循环 GIF 与解码报告 |
| tools/animate-classic-scenes.mjs | 动态背景、人物合成 GIF、运行时接入与周期检查 |
| tools/scene-motion-celestial.mjs / scene-motion-daily.mjs | 七套局部环境动效的原生坐标与轨迹 |
| tools/pixel-svg.mjs | 原像素转可编辑 RGBA 色块路径，无嵌入位图 |
| src/main.jsx / src/styles.css | React 界面 |
| previews/classic/ | 原型对照、整套、混穿与验证产物 |
| CLASSIC_SVG_NOTES.md | 坐标、制作方法、修改与重新生成说明 |
| ATTRIBUTION.md | 原角色、参考图和旧 QQ 秀像素资源来源 |
| BACKGROUND_NOTES.md | 背景方案、联网依据与制作边界 |
| FINAL_DESIGN_NOTES.md | 定稿前的近期角色资料核对与装扮依据 |
| source-art/backgrounds/ | 新绘场景原稿与 generation-prompts.json 提示词记录 |

修改生成脚本后，运行 npm run assets:classic 再 npm run build。直接编辑单件 SVG 后，运行 npm run assets:rasterize 更新展示 PNG，再 npm run build；不需要重跑生成器覆盖手工修改。发型编辑前发/后发两个 SVG。

default 原五层经分层重组后的运行时合成逐像素差异为 0，记录在 previews/classic/base-invariant.json。原 default 脸保持原件；七家特化脸保留原透明边缘，设计源 `face-design.svg` 将皮肤与可编辑眉、瞳、嘴分开，运行时仍使用 `face.svg` / `face.png`。SVG 渲染器可能对少量半透明边缘进行预乘舍入，不宣称 PNG 与 SVG 渲染结果完全相同。

此前新增三套阶段已运行 npm run assets:classic 并完成静态语法检查，查看过原生尺寸、整数倍放大、浅深底及标准参考对照；当时原有四套与 base 资源哈希和新增前一致。这是表情特化前的历史检查，不表示本轮七家脸部资源仍与旧版相同。

表情阶段的备份位于 `previews/classic/expression-before/` 与 `expression-revision-before/`，定稿前装扮备份为 `final-before/`。当前已查看 `final-native.png`、`default-and-seven-plain.png`、`seven-remade-scenes-grid.png` 与实际 GIF 解码帧图 `final-gif-decoded-frames.png`。定稿前后原 default 全目录、七家脸部与新背景文件哈希保持一致，记录为 `final-identity-invariant.json`。

背景预览为 `previews/classic/backgrounds-only-native.png`、`backgrounds-only-2x.png` 与 `seven-remade-scenes.png`；替换前背景备份位于 `background-before/`。原稿按 `cover` 中心裁取、最近邻适配到 140×226，再以 256 色、轻量抖色输出 PNG 与纯路径 SVG。终版已完成资源生成、PNG/GIF 导出、静态语法检查、生产构建及两处依赖审计（均 0 vulnerabilities）。七个 GIF 解码均为 8 帧、无限循环，特效区域之外变化像素为 0；没有新增测试代码，未执行完整 UI 回归或穷举混搭。

旧 public/assets、source-art 中的 v1 人物分件图、ASSET_NOTES.md 与早期预览保留作历史，前端不再默认使用；`source-art/backgrounds/` 则是本轮背景的新原稿目录。所有作品为非官方同人；旧像素素材的权利条件不因转成 SVG 而改变。具体来源与许可边界见 ATTRIBUTION.md。
