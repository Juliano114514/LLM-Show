# 图像来源与署名

## 当前使用的 classic SVG v2

当前前端默认使用 `public/assets-classic/`。新版直接沿用户提供的 `qq-show-classic/` 原像素底板制作：default 的躯干、双臂手与双腿，原库发型的轮廓/色阶及 `wings/小恶魔.gif` 膜翼被描摹成可编辑 SVG path；新衣服、裙、鞋袜、头饰和道具在同一坐标上改编或绘制。七家面部在原脸上特化眉眼、瞳色和嘴角，保留脸型、透明度、耳、鼻、下巴及底板坐标，穿搭沿用现有造型。实际源文件由 `tools/classic-hair.mjs`、`tools/classic-clothes.mjs`、`tools/classic-additions.mjs`、`tools/classic-faces.mjs` 与 `tools/build-classic.mjs` 记录。此版没有调用 image_gen。

本轮表情优先采用用户明确指定的项目人设：DeepSeek“爱吃白饭的大肥鱼”、Claude“家教很严的温婉大小姐”、GLM“犯困的贪睡虫”。相应演绎为 DeepSeek 蓝紫渐水蓝瞳、满足鼓腮和嘴角米粒；Claude「茶金舒缓静容」保留茶金瞳、放松眉眼，以自然平口减去明显笑弧；GLM「灰紫困倦闭口」保留半睁灰紫瞳和松弛眉，去掉哈欠，改为自然闭口。其余方向结合本地 AI Girls Atlas 的 `encyclopedia/personas/` 原创草案及原画；这些创作方向不反向归为品牌或视觉原作者的官方性格。瞳色按 ZipZipPipe 标准正常比例人设图目视归纳，不宣称精准取色。

本轮完整重画眼形，使用相连虹膜、中央瞳孔、同向单高光并降低眉位。`face-design.svg` 分开保留原脸皮肤与可编辑眉、瞳、嘴路径，运行时仍使用 `face.svg` / `face.png`；没有新增 GIF 动画。修正前图备份于 `previews/classic/expression-revision-before/`，重点三家预览为 `focus-three-expressions.png`，本轮前后对照为 `expression-revision-comparison.png`。

转成 SVG 不改变旧素材的权利条件。原库没有提供完备的逐文件作者与再分发授权，因此不能将新版包含旧像素描摹的整包统一标为新创作或 CC BY-NC-SA。角色设计参考的署名和许可仍按下文保留；新旧素材来源分开记录。下文关于内置 image_gen 的制作方式主要对应保留在 `public/assets/`、`source-art/` 的 v1 历史版本。

本项目是 GPT、DeepSeek、Claude、Grok、千问、Gemini 与 GLM 的非官方 AI 娘 QQ 秀同人换装作品，与对应产品及品牌没有官方合作或背书关系。参考图用于角色造型研究，不作为对应品牌的官方标识。

## 新增千问、Gemini、GLM 的标准正常比例参考

三套新增角色以 `../ai-girls-atlas/assets/zipzippipe/` 的原始正常比例立绘为主要造型依据，以 SVG 路径和原底板像素制作换装分件；未使用 ApprenTice 派生图代替原版。此前新增三套阶段，原有四套在当时生成前后资源哈希一致；该历史结果不表示本轮七家表情特化后脸部资源仍与旧版相同。

| 角色 | 本地参考文件（相对 `../ai-girls-atlas/`） | 设计署名 | 本地许可记录 |
| --- | --- | --- | --- |
| 千问 | `assets/zipzippipe/qwen/normal-zipzippipe-pixiv-148186519-p12.jpg` | ZipZipPipe | `author_sharing_statement` |
| Gemini | `assets/zipzippipe/gemini/normal-zipzippipe-pixiv-148186519-p04.jpg` | ZipZipPipe | `author_sharing_statement` |
| GLM | `assets/zipzippipe/glm/normal-zipzippipe-pixiv-148186519-p06.jpg` | ZipZipPipe | `author_sharing_statement` |

三图均来自 [ZipZipPipe 原始设计图集](https://www.pixiv.net/artworks/148186519)，本地上游供应方为 `shuaizenge/ai-girls`，固定树为 `71defe761164407514c1db9bac582d74eab4cdac`。本地记录引用[作者开放分享与再创作声明](https://www.bilibili.com/video/BV1bARXBYEZz/)，未确认统一标准许可证，不能将这些参考图或整套新增资源标成 ApprenTice 的 CC BY-NC-SA、CC0 或 MIT。逐文件来源、作者、许可说明与 SHA-256 保存于 `public/assets-classic/source-references.json`，原始追溯为 `../ai-girls-atlas/data/assets.json`。

标准图与适配对照位于 `previews/classic/new-three-standard-reference.png`；全角色对照位于 `previews/classic/standard-reference-comparison.png`。

## 历史 v1 四套角色的参考与重制

历史 v1 选取 `../ai-girls-atlas/assets/apprentice/` 中风格一致的四张 Q 版图作为参考，通过内置 `image_gen` 重新绘制适用于 QQ 秀的部件图，再按统一画布和锚点整理为可组合的分层资源。历史新图属于参考重制与换装适配，不是原参考文件，也不是原作者直接提供的分层工程；以下制作方式与派生图许可说明对应 `public/assets/`、`source-art/` 中保留的 v1，不是当前 v2 或新增三套的统一许可声明。

以下追溯依据本地 `../ai-girls-atlas/data/assets.json` 与各角色 README；上游记录采集日期为 2026-10-21，本次本地核对日期为 2026-11-09。

| 角色 | 本地参考文件（相对 `../ai-girls-atlas/`） | 原角色/参考设计署名 | 所选派生图署名与原文件 |
| --- | --- | --- | --- |
| GPT | `assets/apprentice/gpt/apprentice-chatgpt-chibi.png` | ZipZipPipe（参考角色设计） | ApprenTice（AI 辅助派生图）；[ChatGPT-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/ChatGPT-Chibi.png) |
| DeepSeek | `assets/apprentice/deepseek/apprentice-deepseek-chibi.png` | 上善无形（原始鲸鱼娘）；ZipZipPipe（女仆二次设计/参考角色设计） | ApprenTice（AI 辅助派生图）；[DeepSeek-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/DeepSeek-Chibi.png) |
| Claude | `assets/apprentice/claude/apprentice-claude-chibi.png` | ZipZipPipe（参考角色设计） | ApprenTice（AI 辅助派生图）；[Claude-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/Claude-Chibi.png) |
| Grok | `assets/apprentice/grok/apprentice-grok-chibi.png` | ZipZipPipe（参考角色设计） | ApprenTice（AI 辅助派生图）；[Grok-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/Grok-Chibi.png) |

四张所选派生图均由 `Apprentice-Geo/AI-Fanworks` 提供，固定提交为 `ee1f5176710f3bcfd60ee5cb0af00f77ed96748e`。[作者目录许可声明](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/README.md)将自己的改编图像标注为 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。本项目历史 v1 四套角色参考重制图与其分层改编沿用署名、非商业、相同方式共享条件；再分发时保留本说明并标明后续修改。该声明不把原角色、品牌、其他参考或旧 QQ 秀素材一并改成此许可。

原角色设计的进一步追溯入口为 [ZipZipPipe 原始设计图集](https://www.pixiv.net/artworks/148186519)。本地目录对 GPT、Claude、Grok 的早期原图只记录了[作者开放分享与再创作声明](https://www.bilibili.com/video/BV1bARXBYEZz/)，未确认统一标准许可证；DeepSeek 另有[原角色及女仆二次设计的许可来源](https://www.bilibili.com/video/BV1tE9XBbErS/)。因此本说明不将所有早期原图概括为 CC0、MIT 或同一份 CC 许可。

## 旧 QQ 秀背景

本项目的 `asset_pipeline` 从用户提供的本地 `../qq-show-classic/backgrounds/` 复用以下背景的静态首帧，并为前端整理输出格式：

| 背景名称 | 本地原文件 |
| --- | --- |
| 星座云台 | `../qq-show-classic/backgrounds/星座云台.gif` |
| 海底世界 | `../qq-show-classic/backgrounds/海底世界.gif` |
| 雏菊花开 | `../qq-show-classic/backgrounds/雏菊花开.gif` |
| 万圣城堡 | `../qq-show-classic/backgrounds/万圣城堡.gif` |
| 中式楼阁（千问） | `../qq-show-classic/backgrounds/中式楼阁.gif` |
| 双子云殿（Gemini） | `../qq-show-classic/backgrounds/双子云殿.gif` |
| 星夜花园（GLM） | `../qq-show-classic/backgrounds/星夜花园.gif` |

本地素材未附完备的逐文件作者及再分发授权。设计参考包 `../skills/qqshow-classic-design/references/RESEARCH_SOURCES.md` 记录了 [QQ Show 2000](https://qqshow2000.com/) 的非官方复刻/档案背景及其素材权利仍归原权利人的说明，但没有证明本地文件与线上文件逐字节相同，也不构成对这七张背景的新增授权。本项目保留这一区别；上述背景不纳入历史四套重制角色的 CC BY-NC-SA 4.0 声明。
