# 图像来源与署名

## 当前使用的 classic SVG v2

当前前端默认使用 `public/assets-classic/`。新版直接沿用户提供的 `qq-show-classic/` 原像素底板制作：default 的五官、躯干、双臂手与双腿，原库发型的轮廓/色阶及 `wings/小恶魔.gif` 膜翼被描摹成可编辑 SVG path；新衣服、裙、鞋袜、头饰和道具在同一坐标上改编或绘制。实际源文件由 `tools/classic-hair.mjs`、`tools/classic-clothes.mjs` 与 `tools/build-classic.mjs` 记录。此版没有调用 image_gen。

转成 SVG 不改变旧素材的权利条件。原库没有提供完备的逐文件作者与再分发授权，因此不能将新版包含旧像素描摹的整包统一标为新创作或 CC BY-NC-SA。角色设计参考的署名和许可仍按下文保留；新旧素材来源分开记录。下文关于内置 image_gen 的制作方式主要对应保留在 `public/assets/`、`source-art/` 的 v1 历史版本。

本项目是 GPT、DeepSeek、Claude 与 Grok 的非官方 AI 娘 QQ 秀同人换装作品，与对应产品及品牌没有官方合作或背书关系。参考图用于角色造型研究，不作为 OpenAI、DeepSeek、Anthropic 或 xAI 的官方标识。

## 四套角色的参考与重制

本次选取 `../ai-girls-atlas/assets/apprentice/` 中风格一致的四张 Q 版图作为参考，通过内置 `image_gen` 重新绘制适用于 QQ 秀的部件图，再按统一画布和锚点整理为可组合的分层资源。新图属于参考重制与换装适配，不是原参考文件，也不是原作者直接提供的分层工程。

以下追溯依据本地 `../ai-girls-atlas/data/assets.json` 与各角色 README；上游记录采集日期为 2026-10-21，本次本地核对日期为 2026-11-09。

| 角色 | 本地参考文件（相对 `../ai-girls-atlas/`） | 原角色/参考设计署名 | 所选派生图署名与原文件 |
| --- | --- | --- | --- |
| GPT | `assets/apprentice/gpt/apprentice-chatgpt-chibi.png` | ZipZipPipe（参考角色设计） | ApprenTice（AI 辅助派生图）；[ChatGPT-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/ChatGPT-Chibi.png) |
| DeepSeek | `assets/apprentice/deepseek/apprentice-deepseek-chibi.png` | 上善无形（原始鲸鱼娘）；ZipZipPipe（女仆二次设计/参考角色设计） | ApprenTice（AI 辅助派生图）；[DeepSeek-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/DeepSeek-Chibi.png) |
| Claude | `assets/apprentice/claude/apprentice-claude-chibi.png` | ZipZipPipe（参考角色设计） | ApprenTice（AI 辅助派生图）；[Claude-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/Claude-Chibi.png) |
| Grok | `assets/apprentice/grok/apprentice-grok-chibi.png` | ZipZipPipe（参考角色设计） | ApprenTice（AI 辅助派生图）；[Grok-Chibi.png](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/Grok-Chibi.png) |

四张所选派生图均由 `Apprentice-Geo/AI-Fanworks` 提供，固定提交为 `ee1f5176710f3bcfd60ee5cb0af00f77ed96748e`。[作者目录许可声明](https://github.com/Apprentice-Geo/AI-Fanworks/blob/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/README.md)将自己的改编图像标注为 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。本项目四套角色参考重制图与其分层改编沿用署名、非商业、相同方式共享条件；再分发时保留本说明并标明后续修改。该声明不把原角色、品牌、其他参考或旧 QQ 秀素材一并改成此许可。

原角色设计的进一步追溯入口为 [ZipZipPipe 原始设计图集](https://www.pixiv.net/artworks/148186519)。本地目录对 GPT、Claude、Grok 的早期原图只记录了[作者开放分享与再创作声明](https://www.bilibili.com/video/BV1bARXBYEZz/)，未确认统一标准许可证；DeepSeek 另有[原角色及女仆二次设计的许可来源](https://www.bilibili.com/video/BV1tE9XBbErS/)。因此本说明不将所有早期原图概括为 CC0、MIT 或同一份 CC 许可。

## 旧 QQ 秀背景

本项目的 `asset_pipeline` 从用户提供的本地 `../qq-show-classic/backgrounds/` 复用以下背景的静态首帧，并为前端整理输出格式：

| 背景名称 | 本地原文件 |
| --- | --- |
| 星座云台 | `../qq-show-classic/backgrounds/星座云台.gif` |
| 海底世界 | `../qq-show-classic/backgrounds/海底世界.gif` |
| 雏菊花开 | `../qq-show-classic/backgrounds/雏菊花开.gif` |
| 万圣城堡 | `../qq-show-classic/backgrounds/万圣城堡.gif` |

本地素材未附完备的逐文件作者及再分发授权。设计参考包 `../skills/qqshow-classic-design/references/RESEARCH_SOURCES.md` 记录了 [QQ Show 2000](https://qqshow2000.com/) 的非官方复刻/档案背景及其素材权利仍归原权利人的说明，但没有证明本地文件与线上文件逐字节相同，也不构成对这四张背景的新增授权。本项目保留这一区别；上述背景不纳入四套重制角色的 CC BY-NC-SA 4.0 声明。
