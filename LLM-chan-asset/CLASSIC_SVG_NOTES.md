# default 底板版 · SVG v2

本版取代前端上一版的大头 Q 版资源。目标是使用用户提供的经典 QQ 秀 default 本身的比例、位置、站姿和像素密度。

## 实际采用的底板

原五层为 `back-hair/default.gif`、`bottom/default.gif`、`top/default.gif`、`makeup/default.png`、`front-hair/default.gif`。画布始终为 140×226，原点与透明留白均保留；脸在 `[50,50,89,87]`，手臂/上衣在 `[30,86,109,135]`，足底为 y211。

原 bottom 按 y145 分成裙与腿后，重新合成 default 与原五层合成逐像素差异为 **0**，记录于 `previews/classic/base-invariant.json`。原 default 脸直接保留原 PNG，避免 SVG 渲染器对半透明边缘的预乘舍入；对应 SVG 仍编码原始 RGBA 像素路径。SVG 与 PNG 导出可能在这些细小半透明边缘存在渲染器舍入差别，不宣称字节相同。

本轮七家都沿同一底板修正眉眼、瞳色与嘴角；完整清除旧眼后重画相连的眼形、连续虹膜与中央瞳孔，保留同向单高光，并降低眉位以减少悬眉和机械感。脸型、透明度、耳、鼻、下巴及共享画布坐标保持，穿搭沿用现有七套。此前新增三套阶段仅做 6 个虹膜像素调色，之后已由独立表情生成器替代。原 default 脸不修改，首轮特化前的原图备份于 `previews/classic/expression-before/`，本轮修正前的版本另备份于 `expression-revision-before/`。

表情方向优先遵循用户指定：DeepSeek“爱吃白饭的大肥鱼”对应蓝紫渐水蓝瞳、满足鼓腮和嘴角米粒；Claude“家教很严的温婉大小姐”保留低饱和茶金瞳，放松眉眼，改为自然平口、无明显笑弧；GLM“犯困的贪睡虫”保留灰紫半睁眼与松弛眉，去掉哈欠，改为自然闭口。瞳色是对 ZipZipPipe 标准正常比例人设图的目视归纳，不是精准采样色值；性格是用户指定的项目同人演绎，不反向归为品牌或视觉原作者的官方设定。其余方向结合本地 `ai-girls-atlas/encyclopedia/personas/` 原创草案与原画。

当前 GPT「淡紫温和微笑」、DeepSeek「蓝瞳馋饭鼓腮」、Claude「茶金舒缓静容」、Grok「碧蓝自信浅笑」、千问「紫瞳端庄浅笑」、Gemini「玫金灵动猫笑」、GLM「灰紫困倦闭口」由 `tools/classic-faces.mjs` 的 `FACE_PROFILES` 定义。Claude 与 GLM 本轮局部调整的预览为 `previews/classic/claude-glm-softened.png`。

## SVG 是怎样制作的

- default 的皮肤、站姿与面部，以及所选原库发型和膜翼，按颜色描摹为整数坐标 path。SVG 内没有嵌入位图，也没有 base64 图片。
- 七家 `face-design.svg` 将处理后的原脸皮肤与眉、瞳/眼睑、嘴/腮红分别保留为可编辑路径；运行时 `face.svg` / `face.png` 使用合成后的静态表情，透明边缘沿用原脸。没有新增 GIF 动画。
- 发型保留原库细密发束材质，在 default 脸的位置上按标准立绘重新设计披发、长侧发与双马尾轮廓，使用可编辑色阶映射为银白、深海蓝、蜜橘和金色。具体原文件、定制形状与调色参数在 `tools/classic-hair.mjs`。
- 上装保留 default 躯干、双臂和手，在原衣片及其边界上绘制新领口、衣袖、领结、银链和装饰。
- 新裙按标准立绘补回长礼裙、开衩、长围裙与不对称层叠裙，使用可编辑几何形状、10 级窄幅褶皱、原 default 灰裙的明暗纹理；纹理被裁在新裙轮廓内。裙长变化只遮挡原腿，身体与脚的位置不变。鞋袜沿原交叉腿和脚的位置绘制。
- 头饰、书、鲸尾、云团、斧杖和闪点是小尺寸 SVG 绘图。膜翼沿原库 `wings/小恶魔.gif` 的形状重着色。
- 此轮以 ZipZipPipe 原标准正常比例立绘为主要造型依据：GPT 默认道具为蓝白小云团，Claude 为竖持的深棕金边书；星仪与打开书是此前 ApprenTice 派生版本的做法。GPT 发、角、翼、尾、衣裙共用 `tools/classic-theme.mjs` 的珍珠白/淡银紫/银色调色板。
- 新增千问保留蓝紫长卷辫、斜帽流苏、中式盘扣宽袖、金边多层长裙、折扇与手袋；Gemini 保留蓝紫粉渐变长发、猫耳猫尾、四角星、异色瞳、不对称短裙与长垂布、白堆袜；GLM 保留黑蓝长发、白耳毛狐耳、睡眠眼罩与银铃、黑白层叠长裙、白尖狐尾与 Z 纹书。角色配置及道具/背饰位于 `tools/classic-additions.mjs`，服饰与发型沿用现有生成器。
- 三套新增背景分别取 `backgrounds/中式楼阁.gif`、`backgrounds/双子云殿.gif`、`backgrounds/星夜花园.gif` 的静态首帧。
- SVG 在 140×226 栅格化一次，前端用 PNG 最近邻放大，以稳定原生像素密度。所有 SVG 源文件同时保留，并能在页面中合成下载。

## 编辑位置

| 目标 | 文件 |
| --- | --- |
| 发型轮廓来源、七套发色和头饰 | `tools/classic-hair.mjs` |
| 上衣、裙、鞋袜、色板与服装细节 | `tools/classic-clothes.mjs` |
| 翅膀、鲸尾、披肩、道具、背景、清单与合成 | `tools/build-classic.mjs` |
| 千问、Gemini、GLM 配置、背饰、道具与背景 | `tools/classic-additions.mjs` |
| 七家表情方向、原皮肤与可编辑眉眼嘴 | `tools/classic-faces.mjs`；输出 `face-design.svg` / `face.svg` / `face.png` |
| 可直接在矢量编辑器中编辑的单件 | `public/assets-classic/{角色}/*.svg` |
| 本次新增道具/背饰的几何设计稿 | 同目录 `*-design.svg` |
| 整体对照和原版部件混穿预览 | `previews/classic/` |

修改生成脚本后运行：

```powershell
node tools/build-classic.mjs
npm run build
```

这将重建 SVG、PNG、清单与对照图。手工修改输出 SVG 后，应运行 `npm run assets:rasterize` 更新展示 PNG 和对照图，再运行 `npm run build`；此流程不调用源生成器，不会覆盖手工编辑的分件 SVG。发型编辑 `hair-front.svg` / `hair-back.svg`，合并的 `hair.svg` 仅作缩略源，会自动重建。重新运行 `assets:classic` 则会按脚本覆盖生成文件。所有新的运行时资源位于 `public/assets-classic/`；上一版 `public/assets/` 与 `source-art/` 保留作历史记录，前端不再默认加载。

## 验证边界

此前新增三套阶段实际运行 `npm run assets:classic` 并完成静态语法检查，查看过新增三套原生/整数倍放大、浅深底、七套与 default 同尺寸并排及标准立绘对照；当时原有四套与 base 资源哈希均与新增前一致。这是表情特化前的历史结果。

本轮资产生成使用 `npm run assets:classic`，检查范围为脚本静态语法、原生尺寸、浅深底与头发合成。重点三家预览为 `previews/classic/focus-three-expressions.png`，修正前后对照为 `expression-revision-comparison.png`；七家浅深底及头发合成产物为 `seven-expressions-light.png`、`seven-expressions-dark.png`、`seven-expression-heads.png`。首轮特化前的原图备份为 `expression-before/`，本轮修正前的版本为 `expression-revision-before/`。本轮没有新增测试代码或动画，未执行生产构建或完整 UI 回归，也不以本轮脸部变化后的资源哈希沿用此前“旧四套全部不变”的结论。

预览：`previews/classic/new-three-native.png`、`new-three-light.png`、`new-three-dark.png`、`new-three-standard-reference.png`；七套合成为 `default-and-seven-plain.png`、`default-and-seven-scenes.png`，全角色标准对照为 `standard-reference-comparison.png`。此前已查看旧 default 与原四套部件混穿；本轮没有穷举所有混搭或整个旧素材库，不将结果扩展为所有旧姿态兼容。

## 来源

角色识别点仍参考 AI Girls Atlas 中 ApprenTice/ZipZipPipe 的设计（DeepSeek 原角色另署名上善无形）。新版同时实际描摹、改编了用户提供的旧 QQ 秀像素资源；旧素材的权利条件未因转成 SVG 而改变，不能把整套描摹素材统一标为新创作或一份 CC 许可。详见 `ATTRIBUTION.md`。
