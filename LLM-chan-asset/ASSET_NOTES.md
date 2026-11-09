# AI 娘 QQ 秀资源说明

四套形象是基于本地 `ai-girls-atlas` 参考重新制作的非官方同人换装部件。美术生成使用 OpenAI 内置 `image_gen`，后续以 Node.js / sharp 完成透明图层提取、显式坐标校准与合成。资源为静态 PNG。

## 资源与对齐

- 运行时资源：`public/assets/`；清单：`public/assets/manifest.json`。
- 四角色：GPT「星语龙姬」、DeepSeek「深蓝鲸语」、Claude「橘光书笺」、Grok「夜幕蔷薇」。
- 11 个可替换槽：场景、光环、翅翼、发型、鞋袜、裙装、上装、表情、头饰、手持、闪光；共 44 件物品。
- 发型以同一物品原子替换前发、后发，实际共 48 张穿戴图层。`hair.png` 只用于完整发型缩略图；穿戴使用 `hair-back.png` 与 `hair-front.png`。
- 除独立头像缩略图外，所有图层和完整人物均保留 `140×226` 完整画布；坐标原点是左上角，图层共同放大，不能逐件按可见内容居中。
- 新姿态族为 `llm-standing-v1`。脸部、衣领、腰线和脚底经过共同锚点校准；不承诺与整个历史 QQ 秀库的姿态兼容。
- 从后到前：场景 0、光环 5、背饰 10、后发 20、鞋袜 30、裙装 40、上装 50、脸 60、前发 80、头饰 90、手持 100、闪光 110。

每张源图是 4 列 × 3 行的部件板，原图保存在 `source-art/*-sheet.png`。生成结果存在部件位置漂移，实际源提取区域与目标锚点明确记录于 `tools/asset-calibration.json`；没有把所有部件无条件裁边后居中。

Claude 原始源图带有非零 alpha 的灰雾背景。取样显示皮肤、橙发、白衣内部 alpha 为 248–252，而背景、脸洞为 45–127。处理仅将 alpha 190 以下映射为 0、246 以上映射为 255、中间线性过渡，RGB 未改变；原文件保留，另附 `source-art/claude-sheet-alpha-cleaned.png`。阈值与理由同时写入来源清单。

## 预览与实际检查

`previews/` 中保存了四套原生合成、3 倍透明人物、3 倍完整场景、浅深底 2 倍预览，以及：

- `four-characters-scenes.png`：四角色完整场景。
- `four-characters-light.png` / `four-characters-dark.png`：浅深底完整合成。
- `face-hair-cross-4x4.png`：4 张脸 × 4 套发型，共 16 种组合，去除头饰以查看脸洞对齐。
- `four-mixed-outfits.png`：4 套不同角色的衣服、裙装、脸、发型、鞋袜、配饰循环混搭。
- `asset-report.json`：源文件哈希、实际提取区域、输出 alpha 边界及校准参数。

已实际查看四套合成、Claude 浅深底、16 组脸/发型组合和 4 组完整混搭。检查覆盖领口、腰线、脚底、前后发遮挡、眼睛可见性、白衣与肤色、道具是否遮脸。没有制作或验证动画，也没有穷举所有槽位的全部组合。

## 来源与署名

参考图为 ApprenTice 的 AI 辅助派生图；参考角色设计为 ZipZipPipe，DeepSeek 原始鲸鱼娘为上善无形。本地来源记录将这四张参考图标注为 **CC BY-NC-SA 4.0**。本次角色重制沿用非商业、署名、相同方式共享条件；角色与品牌权利仍归相应权利人。

参考图来源、作者、许可声明链接与 SHA-256 完整保存在 `public/assets/source-references.json`，来自 `ai-girls-atlas/data/assets.json` 的逐文件记录。

经典背景取自本地 `qq-show-classic/backgrounds/`：GPT「星座云台」、DeepSeek「海底世界」、Claude「雏菊花开」、Grok「万圣城堡」。仅解码并导出各自首帧，原图未修改；背景的原有权利条件单独保留，不将其宣称为新创作或统一授权。

## 重新生成分件

在本项目目录运行：

```powershell
npm ci --prefix tools/.deps
node tools/prepare-assets.mjs
```

此过程读取 `source-art` 中的生成图与相邻的两个本地参考库，重建运行时图层、清单、来源记录和预览，不调用图像生成服务。前端运行时只需要 `public/assets/`，无需访问参考库。
