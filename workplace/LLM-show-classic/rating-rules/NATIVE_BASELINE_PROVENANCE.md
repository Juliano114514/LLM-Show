# 原生完整基准与 AI 接口来源契约

新策略由 `native-lower-provenance-v1` 明确启用。原生完整组合的100分是用户指定基准；它不授予新增隐藏体块100分，也不证明 AI 混搭达到98分。

本轮扩容池保留20件真实下装源（原15件字节不变，加5件真实裤装），均提供完整140×226首帧。Review 的 bottom、legs 从20个同源配对中无放回抽5，arrangement 同时移动两槽；上衣按源alpha躯干连续性图匹配、与裙腿共同复排，其他槽独立抽样。相同 seed、poolHash、arrangement 重现同一组。五组是有限覆盖，不是穷举。

| 下装选择 | 共享解析器实际绘制 | 评分归属 |
|---|---|---|
| 原生裙、腿同源 | 一张 `originalFull`，记录 `coversSlots`、原源hash | 真实原件基准100；没有生成填补 |
| 原生裙、腿跨源 | 两张真实可见分件，无隐藏补片 | 普通衣橱的片段组合；不称完整原件复现；Review随机基准不产生此种拆配 |
| AI腿、原生裙 | 原可见裙层、必要真实腰肤context、AI腿 | 腰肤来自原源；整体混搭仍独立评98 |
| AI裙、原生腿 | 原可见未补腿、独立 `hiddenPatch`、AI裙 | 补片归 AI 替换的接口支持层，随 AI 融合98评审；不能算原生100 |
| 两槽均AI | 本轮AI自身图层 | 不注入原生隐藏补片 |

`src/classic-layers.mjs` 是普通衣橱与 Review 共用的解析器。相同 manifest、selection、excludeSlots 得到相同图层。完整原生下装在 bottom 的原生层级绘制一次；隐藏补片位于真腿之上、AI裙之下。排除某个 lower 槽时不会借完整源图偷偷显示被排除的槽。

## 素材字段

原生 bottom、legs item 的正式 `src` 分别为真实可见 `bottomPng`、`unfilledLegsPng`，均无生成隐藏体块。两者的 `nativePartition` 包含：

- `policy`、`sourceKey`、`source`、原GIF `sourceFileHash` 与首帧RGBA `sourceRawHash`。
- `originalFullSrc/originalFullHash` 与 `originalFull` PNG/SVG描述。
- `visibleBottom`、`visibleLegs`、`waistContext` 的src/svg/artworkHash。腰肤仅复制原源原坐标已有像素。
- 独立 `hiddenPatch` 描述、像素数和hash。其来源、donor坐标、逐行映射、原源可见像素保护及适用边界在 `metadataSrc`。
- 候选03独立QC报告及hash。该QC允许有边界的派生参考输入，不把新增接口变成官方裸模。

原15件全部保留，包含弯腿、交叠腿、宽裤和网袜。不能用删难样本或把裸肤塞回裙层避开接口问题。候选03已批准的图层像素继续按hash校验；新增腰肤导出不改变这些图层。

## AI 接口与评分绑定

解析器为 AI裙替换产生的支持层明确写入：

```json
{
  "generatedInterface": true,
  "slot": "bottom",
  "itemId": "当前AI-bottom",
  "interfaceForItemId": "当前AI-bottom",
  "nativeSourceItemId": "native-legs-N",
  "nativeSourceKey": "native-lower-N",
  "artworkHash": "独立hiddenPatch的sha256",
  "reviewScope": "AI fusion >=98; never native100"
}
```

此层进入每例 `actualAiLayers`，不是原生基准层。页面证据另给 `generatedInterfaceHashes`，键为 `caseId:layer.key`，值为补片hash。独立单件/多件评分 entry 必须提供完全匹配的 `reviewedGeneratedInterfaceHashes`；缺失时显示“新增接口层待评审”。它还须匹配既有 AI part/family hashes、seed、contextSignature 和逐上下文分数。没有自动98分。

新策略 contextSignature 使用v4，包含新池、联动选择、实际 lower layers 和生成接口hash。原生完整首帧、可见分件、补片、腰肤残留、动画源及所有影响渲染的hash均进入新poolHash。更换接口不能借旧评分过关。

后续显式AI-owned接触色簇可与原hiddenPatch合成独立interface；只在AI-bottom×匹配native source指纹时使用，即使原patch为0也可有真实contact。原生pool/原件不改，透明disabled模板不启用。新top/接触policy只对实际opt-in选择使用v5，绑定全部实际AI层；无flag仍保留v4。输入/输出hash、局部色簇限制及作者流程见[COMPATIBILITY_INTERFACES.md](COMPATIBILITY_INTERFACES.md)。这不是新增原生100像素或免审AI98。

## 旧池与素体验收

没有新policy字段的冻结池继续旧解析和抽样路径，使用原native-context-v3。`--reuse-native-pool` 不调用新切分、不新增policy、不重写原部件/接触表，保留当前池原有的 items、partitions、fixtures、coverage、poolHash；只沿用既有角色/素体引用刷新行为。旧轮回放池hash为 `1f340b65f818fc4c7920ecae880ec45adf6ce209676d75288705870e5d1647fe`；当前正式池为CURRENT_STATE所列cfd19b90…，沿用v4。

BODY页的原default和20女性classic样本保持真实原图；不使用隐藏补片。原default五层也不具新policy，原解析保持不变。

来源分离当轮先用 `node tools/build-classic-native-review.mjs --staging` 写入 `previews/native-baseline-provenance/staging/`，该目录保留逐像素来源与渲染证据；此策略之后已由root切入正式cfd池。当前A/B兼容接口工作仍仅源码及 `previews/classic-compatibility/` staging，不执行public apply；新增AI兼容图须由root冻结并另行实际审阅98。


## 2026-11-10 扩容与完整性

新增5件裤装的源图/分件/隐藏裤料支持、重合成零差和独立QC位于 `ai-workspace/previews/native-expansion-20261110/`。隐藏支持只复制同源同坐标已遮盖裤料，仍随AI融合评分，不变为原生100。背饰库存仅17件非空原件，其他10槽各20件，共217；不以空图凑20。

`native-complete-torso-v1`对20上衣×20下装的真实alpha在x62..77/y100..136逐行检查至少3个不透明像素，防躯干横向断层。它只验证指定中央区域，不证明全身体形或审美；独立看图仍必需。全部源均须有可用配对，随机抽5件的匹配不读取任何AI图或分数，记录完整候选图与实际draws。
