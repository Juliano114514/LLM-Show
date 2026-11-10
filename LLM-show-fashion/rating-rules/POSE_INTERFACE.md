# 原生姿态与 AI 部件接口

本文件补充现行 [98/90 评分规则](SCORING.md)、[随机多 AI 混搭流程](PROCESS.md)和[迭代规则](ITERATION_RULES.md)。接口可复现只证明装配位置有依据，不是美术通过证明。绘制、原生借用、重绘连接和评分责任继续保持透明。

本文件的数量、hash和家族表是工程接口快照，下次使用前核对实际catalog、模型和源文件；不把日期快照数字当永久评分事实。用户已删除的归档不自动恢复，资料缺失须说明。本页命令是工具说明，不自动授权生成新资产或继续返修。

2026-11-10 用户追加：标准素体/四肢与标准立绘有非常显著动作差异时必须扣分；“神似”不豁免握持变摊掌、提裙变垂手、显著抬臂/屈腿/重心偏差。标准端以所选立绘为姿态权威，原生兼容端以目标原生body接口为权威，两者分别审计；不得把兼容件原生姿态正确当成标准姿态正确。旧体块可因该审计在角色模块内重绘并连带更新掌指、服装与持物。

## 数据和坐标

事实来源是 `ai-workspace/runtime/catalog.json`。生成入口为：

```powershell
node tools/remake/build-pose-contracts.mjs
```

输出位于 `ai-workspace/workspace/pose-contracts/`：

| 文件 | 用途 |
| --- | --- |
| `contracts.json` | 12 个原生 body 目标、候选路径、原 SWF/导出帧路径和 SHA、来源路径 ID、姿态族、关节和接口、鞋随动参数 |
| `hand-interface-measurements.json` | 5 个上肢家族的左右手 parcel 接触点、实测范围和边界采样段 |
| `native/pose-{0..4}/screen-{left,right}-hand.svg` | 原始完整可见掌指及其前臂 stub，140×226 原坐标 |
| `native/pose-{0..4}/screen-{left,right}-forearm-stub.svg` | 供接缝适配的原局部；远端切线依据人工腕点，不是自动恢复的骨骼边界 |
| `hand-parcels-and-anchors.png` | 5×2 手部接口局部图板 |
| `targets/native-body-N-anchors.svg`、`twelve-target-pose-anchors.png` | body 加对应原生 hands 的完整目标图及标注 |
| `raw-vs-mask-recomposition.png`、`recomposition-diagnostics.json` | 同倍率原路径/ROI union、实际 catalog arms+hands 重组、像素差诊断 |

所有点均是 **140×226 舞台坐标**，不是页面 CSS 像素。`screenLeft`/`screenRight` 指观者左右。sourceRefs 的本地路径相对 `D:/LLM-show`；`nativeBodySrc` 和 `parts.*.src` 是 React public 根目录中的资源 URL；`nativeParcelSrc`/`nativeStubSrc` 相对 `ai-workspace/workspace/pose-contracts/`。

`targetGeometryHash` 从对应原生 body 候选读取，不可从 N 推断或硬编码。2026-11-10扩充后的244候选池 nativeHash 为 `d68eec334e39f69a89bd6c05fb8c91a56a781df2a353bcc97ceb59ac3d34fabc`。此前 `3543680f8c9e4467b3503060a0ad96230cea03e92b8664668d5d0ec41efa898f` 属于旧池；历史冻结保留原值。重新拆分或改源后必须以实时 catalog 重生成，旧目标 hash 和旧评分不能沿用。

## 姿态家族和覆盖

| native body | 上肢家族 | 官方腿姿 |
| --- | --- | --- |
| 1 | pose-0 默认 | 0 |
| 2–7 | pose-0 默认 | 1–6 |
| 8 | pose-1 外展托掌 | 0 |
| 9 | pose-3 抬腕 | 0 |
| 10 | pose-1 | 1 |
| 11 | pose-3 | 2 |
| 12 | pose-1 | 6 |

实际使用 `families`/catalog `partFamilyMap` 找各解剖件，不假设 body 数组序号等于解剖候选序号。`findFamilyPart(catalog,key,family)` 同时检查 `familyId` 与去重后的 `familyIds`。

上肢参照原件：pose-0 为 `1000017-448`（默认胸颈参照 `1000016-436`），pose-1 为 `1023350-421`，pose-2 为 `1023351-421`，pose-3 为 `1023352-421`，pose-4 为 `1031454-442`。pose-2 左掌受原衣装遮挡，只能引用可见前臂/腕，不能称为恢复了完整原生掌。pose-3 的空白胸腹为透明区域，不能认作浅色裙装。pose-4 的肩肘被衣装遮住，标注含估计。

下肢参照为默认 `1000018-406` 及实际恢复的 `1000501-406` 至 `1000506-406`。身体候选含共享默认上身及明确组合的臂姿，并非 12 套分别恢复的裸体。原生 sourceGeometryIds 是来源放置路径的追溯标识，语义 ROI 内不保证每条路径都具有非零可见面积。

`anchors.upper` 包含 shoulder、elbow、anatomicalWrist、palmDirectionPoint 和 handAttachment；`trunk` 包含颈、腰、骨盆/髋；`lower` 包含髋、膝、踝、跟和趾。人体关节点是实际看原图网格后的人工作图标注，带 `status` 和 `uncertaintyPx`。被遮髋部、覆盖上臂和交叉腿的隐藏左右关系没有被自动恢复；小数位数不代表测量精度。踝点是脚踝轮廓的人工定位，不可代替整只脚的原曲线或原鞋摆位。

## 掌、腕与袖口的区别

原生 `hands` 语义件包含一段前臂。`anatomicalWrist` 是人工腕关节位置；`handAttachment` 是前臂 parcel 与原生 arm mask 接触的位置。只把一只新掌移动到腕点，可能在原手件切边与腕之间留下空洞。袖口应接完整 stub 的真实切边，或补画该段前臂并单独复核。

主要接触边如下。数值来自 8 倍渲染 alpha≥128 的采样中心，误差范围约 0.25 原生像素；SVG 切边本身是整数坐标，采样中心在其内侧。

| 家族/侧 | 接触切边 | 采样跨度 |
| --- | --- | --- |
| pose-0 左 | y=105 | x48.9375–54.8125 |
| pose-0 右 | y=79 | x96.0625–100.8125 |
| pose-1 左 | x=36 以及 y=80，L 形 | 竖段 y75.8125–79.9375；横段 x32.4375–35.9375 |
| pose-1 右 | x=104 | y106.3125–114.1875 |
| pose-3 左 | y=105 | x46.6875–52.9375 |
| pose-3 右 | y=73 | x89.1875–94.3125 |

`boundaryRuns` 和 `contactBounds` 记录具体测量。中心点仅作定位，不能代替整个接触段或强迫袖口过窄。测量算法为：8 倍透明渲染中寻找手 alpha≥128 且距 arm alpha≥128 不超过 2 个采样像素的点，取最大连通簇。它测量语义切边，不能叫作自动骨骼检测。

原旧矩形曾裁掉默认左手外指、默认右手左指、pose-1 左掌缘及右四指、pose-3 左指尖和右拇指。修复记录在 `ai-workspace/workspace/pose-contracts/roi-corrections.json`，共享构建器读取的副本为 `tools/remake/data/native-roi.json`。右掌与肩部、左掌与大腿接近时使用透明间隙多边形；不能靠扩大矩形把无关肤色条当作手。修复后的原生池是新一轮基准，旧轮证据已由主 agent 冻结。

## 角色兼容 manifest

每个角色写入 `ai-workspace/workspace/{id}/compatibility/manifest.json`：

```json
{
  "contractVersion": "fashion-pose-compatibility-v1",
  "poses": {
    "native-body-8": {
      "targetGeometryHash": "从contracts.poses[native-body-8]读取的真实hash",
      "layers": {
        "body": "native-body-8/parts/body.svg",
        "hands": "native-body-8/parts/hands.svg",
        "top": "native-body-8/parts/top.svg",
        "shoes": "native-body-8/parts/shoes.svg"
      },
      "anatomy": {
        "left-arm": "native-body-8/anatomy/left-arm.svg",
        "right-arm": "native-body-8/anatomy/right-arm.svg"
      },
      "binding": {
        "footType": 0,
        "shoeOffsets": {"right": [0,0,0], "left": [0,0,0]}
      },
      "provenance": [
        {
          "part": "hands",
          "nativeBorrowing": "按实际情况写明借用哪段原掌/前臂",
          "sourceCandidateId": "实际原生候选id",
          "sourceGeometryHash": "实际来源hash",
          "changes": "按实际情况写明原轮廓/渐变保留和新绘内容"
        }
      ]
    }
  }
}
```

示例中的文件和文字是格式说明，不是已经生成或通过的资产。`layers` 使用现行主槽 key；`anatomy` 使用 rear-leg、front-leg、torso、neck、left-arm、right-arm、hands。文件均为相对兼容目录的 SVG 路径，不用绝对路径或 `..`。只填真实产生的变体；缺少变体是覆盖缺口，不可宣称整轮通过。body 变体应和同版本 anatomy 体块一致，不能另存不参加装配的展示素体。

全套 AI 标准图继续使用该角色标准立绘姿态的原艺术文件。只在**仍含原生件的混搭**中，按所选原生 body 目标使用该角色同设计的姿态变体；多 AI 混搭也适用。兼容变体只能适配位置、姿态及必要连接，不能为分数把 AI 衣服、配饰、材质或身份特征换成原生商品。裸体原局部借用须记录到 provenance/nativeBorrowing，仍接受独立评分，不能自动视为100。

上一段“不能换成原生商品”指不能在compat偷换为与标准AI设计不同的现成款。允许相吻合的原生完整构件/局部曲线作重建母版，在标准与全部兼容稿中保持同一参考设计并透明记录来源；两项视觉评分不以“纯原创路径比例”为标准。参见ITERATION_RULES的允许绘制方式。

头/发与躯体是不同的接触条件：body geometryHash匹配不证明耳、角、冠、头箍已接住所选原生头发。原生发型在本轮独立抽取，不能把body id当成发型接口。头饰须有完整自然根部，并检查原生短发/长发、单件、若干AI及自有前发相邻的不同遮挡；不能只在自有全套前发中遮缝。GeminiR12单headwear N1有耳根悬浮，而自有前发相邻及全套连贯，这是实际反例，不是全套缺件。修AI根部/必要自身适配，未选择的原生头发/头脸保持不动。

目录构建器负责把兼容资源复制到 `public/ai/{id}/compatibility`；React 与离线评审使用同一模型选变体。主 agent 维护该集成，本接口生成器不改 renderer/catalog 的状态。`validateCompatibilityManifest(manifest,contracts)` 仅检查版本、已知目标/hash、局部 SVG 路径、footType 和非空 provenance，不检查画风、内容正确性或覆盖是否完整。

## 刚性适配函数

`tools/remake/pose-contracts.mjs` 导出：

```js
import {rigidTransformFromAnchors, applyMatrix}
  from './pose-contracts.mjs';

const placement = rigidTransformFromAnchors({
  sourceJoint: sourceWrist,
  sourceDirectionPoint: sourcePalmDirection,
  targetJoint: targetWrist,
  targetDirectionPoint: targetPalmDirection
});
// placement.svgTransform: matrix(a b c d e f)
// applyMatrix(point, placement.matrix)
```

此函数仅旋转和平移，scale 始终为1。joint 精确对齐，方向轴对齐；不同轴长不会偷偷缩放，差值以 axisLengthDifference 返回。它不保证第二个方向点的坐标也重合，更不保证袖口、轮廓遮挡、光照、掌根粗细或绘画风格通过。对适合的单段前臂/掌指保留原曲线和 paint，再独立绘制连接；不做整图 TPS、强行等比缩放或全身轮廓形变。

## 鞋和足型

`binding.shoeOffsets` 为原官方配置中的 `[dx,dy,angle]`，作用在保持原 140×226 注册坐标的单侧鞋 SVG 上：

```svg
<g transform="translate(dx dy) rotate(angle 0 0)">…原单侧鞋…</g>
```

right 对应物理层415，默认画面右足；left 对应418，默认画面左足。交叉腿仍保留原物理层命名，不能从左右脚画面位置推断隐藏骨骼左右。`rotationOrigin` 为 `[0,0]`。主 agent 已实际查看原415/418与官方腿姿1、5、6的叠合证据 `ai-workspace/workspace/research/native-recovered/shoe-binding-audit.png`；这里没有声称跑过 Flash 或对所有商品逐件验证。不要改成围绕鞋 bbox 中心旋转。

如果 AI 鞋已经按目标腿姿绘在舞台坐标中，应避免再次套用原鞋偏移；角色 provenance/binding 需明确鞋文件是标准注册件还是已摆位变体，由共享 renderer 使用统一约定。用人体 ankle 人工点搬动整双鞋不能代替对足背、鞋口、跟、趾和遮挡的逐件实际检查。

## 验收边界

已实际查看5家族手部接口板、7种腿姿网格、12目标图板及原 mask 重组对照。当前4倍重组诊断的 RGB 差大于2的采样像素为0、6、6、13、1，最高等效0.8125原生像素面积，局部最大通道差17。差异集中在相邻裁边的抗锯齿；这不是人类感知误差、不是风格评分，也没有证明原生 source skin 分类全部正确。

每角色变体仍必须进入新随机五组原生、单件、多件、相邻接口和全套身份对照。原生100是校准定义，不能忽略 AI 新引入的悬空、错足型、断腕、露缝、重边或换设计。实际组合图片、输入/hash、评分与修改意见必须一起回送原绘制 agent；只有独立评分融合最低98+、全套立绘/MD还原90+同时满足，才放行。
