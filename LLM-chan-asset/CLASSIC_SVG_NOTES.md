# default 底板版 · SVG v2

本版取代前端上一版的大头 Q 版资源。目标是使用用户提供的经典 QQ 秀 default 本身的比例、位置、站姿和像素密度。

## 实际采用的底板

原五层为 `back-hair/default.gif`、`bottom/default.gif`、`top/default.gif`、`makeup/default.png`、`front-hair/default.gif`。画布始终为 140×226，原点与透明留白均保留；脸在 `[50,50,89,87]`，手臂/上衣在 `[30,86,109,135]`，足底为 y211。

原 bottom 按 y145 分成裙与腿后，重新合成 default 与原五层合成逐像素差异为 **0**，记录于 `previews/classic/base-invariant.json`。运行时的脸直接保留原 PNG，避免 SVG 渲染器对半透明边缘的预乘舍入；对应 SVG 仍编码原始 RGBA 像素路径。SVG 与 PNG 导出可能在这些细小半透明边缘存在渲染器舍入差别，不宣称字节相同。

## SVG 是怎样制作的

- default 的皮肤、站姿与面部，以及所选原库发型和膜翼，按颜色描摹为整数坐标 path。SVG 内没有嵌入位图，也没有 base64 图片。
- 发型保留原库细密发束材质，在 default 脸的位置上按标准立绘重新设计披发、长侧发与双马尾轮廓，使用可编辑色阶映射为银白、深海蓝、蜜橘和金色。具体原文件、定制形状与调色参数在 `tools/classic-hair.mjs`。
- 上装保留 default 躯干、双臂和手，在原衣片及其边界上绘制新领口、衣袖、领结、银链和装饰。
- 新裙按标准立绘补回长礼裙、开衩、长围裙与不对称层叠裙，使用可编辑几何形状、10 级窄幅褶皱、原 default 灰裙的明暗纹理；纹理被裁在新裙轮廓内。裙长变化只遮挡原腿，身体与脚的位置不变。鞋袜沿原交叉腿和脚的位置绘制。
- 头饰、书、鲸尾、云团、斧杖和闪点是小尺寸 SVG 绘图。膜翼沿原库 `wings/小恶魔.gif` 的形状重着色。
- 此轮以 ZipZipPipe 原标准正常比例立绘为主要造型依据：GPT 默认道具为蓝白小云团，Claude 为竖持的深棕金边书；星仪与打开书是此前 ApprenTice 派生版本的做法。GPT 发、角、翼、尾、衣裙共用 `tools/classic-theme.mjs` 的珍珠白/淡银紫/银色调色板。
- SVG 在 140×226 栅格化一次，前端用 PNG 最近邻放大，以稳定原生像素密度。所有 SVG 源文件同时保留，并能在页面中合成下载。

## 编辑位置

| 目标 | 文件 |
| --- | --- |
| 发型轮廓来源、四套发色和头饰 | `tools/classic-hair.mjs` |
| 上衣、裙、鞋袜、色板与服装细节 | `tools/classic-clothes.mjs` |
| 翅膀、鲸尾、披肩、道具、背景、清单与合成 | `tools/build-classic.mjs` |
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

已查看原生/整数倍放大、四套与 default 同尺寸并排、旧 default 与新部件混穿、原背景合成。没有穷举整个旧素材库，也不将这些结果扩展为所有旧姿态兼容。

## 来源

角色识别点仍参考 AI Girls Atlas 中 ApprenTice/ZipZipPipe 的设计（DeepSeek 原角色另署名上善无形）。新版同时实际描摹、改编了用户提供的旧 QQ 秀像素资源；旧素材的权利条件未因转成 SVG 而改变，不能把整套描摹素材统一标为新创作或一份 CC 许可。详见 `ATTRIBUTION.md`。
