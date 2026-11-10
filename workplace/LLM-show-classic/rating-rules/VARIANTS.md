# 当前绘制版本与原生姿态适配

本轮道具必须在原生手势中有可见的接触或独立支撑。不能只把AI自己的握物手势复制到图上，声称它兼容所有原生手；不能移动原生手来抬分。

## 同一部件的两个正式运行时变体

作者模块可提供`nativeLayers: {prop: '内部SVG路径'}`。这不是验收台临时替图：`remake-classic.mjs`产出独立预览，统一apply以后保存`prop-native.png/svg`并接入普通衣橱的`defaultVariant`。

- 本角色AI上装控制pose时，使用忠于normal的`layers.prop`持物版。
- 原生上装控制default pose时，使用本轮作者绘制的`nativeLayers.prop`展示版，例如清楚的书架、碗托或斧架。支撑/夹托/落地脚必须画出，不能用文案解释漂浮。
- 没有native展示变体的本轮部件继续使用本轮own-pose图，不能退回旧standing。旧文件仍保留作历史材料。

普通衣橱、静态导出、场景导出和验收台共享`src/classic-layers.mjs`。该规则只影响`classic-body-first-remake-v1`部件，原default及原生项目不受影响。root已实际核对原default合成仍与原五层像素差0；当前首版尚无新native展示图，作者完成后才统一apply。

## 哈希和评分

`artworkHash`仍为单个PNG；`reviewFamilyHash`覆盖`{own: ownPNGHash, ownLayers: 子层hash与z或null, native: nativePNGHash|null}`。hair/top的每个实际子层也绑定，避免只看合并PNG漏掉被别层盖住的修改。单件和多件的`reviewedPartHash(es)`优先绑定这个版族哈希；改任一变体/子层都使对应评分待复审。`reviewVariants`、report.nativeDisplayVariants和每例actualAiLayers中的variantRole/artworkHash记实际使用哪张图。

必要多件组会同时覆盖两个用途：accessories3使用原生上装及展示道具，nearFull8包含角色AI上装及持物道具。两者分别实际截图、独立审阅，最低各98。不能只测较容易的一种，也不能用展示版替换normal全套的动作来抬立绘90分。

角色N/A与姿态变体不同：Claude、Qwen无独立back仍是N/A，不为该槽新画道具。nativeLayers现另支持作者完整top，或top:{body,arms,bodyZ?,armsZ?}；仅选当前AI top且所选prop来自native时使用，hide不改变所选身份。它会替换整套own衣身/手臂，不自动叠加own arms；没有显式真实top的角色不变。原生道具位置不同，每例仍须独立评98，不能延指或移动原生物代替适配。完整契约与staging范例见[COMPATIBILITY_INTERFACES.md](COMPATIBILITY_INTERFACES.md)。

新top的native子层/z及native-prop-top-v1 policy绑定family；逐原生腿的AI-owned authored contact interface也可显式输入，输入摘要不引用family，避免循环。新policy只在实际opt-in的选择上启用v5证据签名；无flag仍原v3/v4，透明disabled模板不改变当前角色或历史评分。
# 完整成品哈希的文件口径

`completeHash`绑定`character.png`：十层各自以原生尺寸PNG渲染后按运行时层次合成，与React实际逐PNG层一致。`04-complete.png`是单份合并设计SVG的阶段渲染，跨层抗锯齿/透明合成可能给出不同字节，不能把它的SHA冒作运行时completeHash；`04-complete-design.svg`保留可编辑设计用途。bodyHash则绑定真正冻结body PNG。报告须明确文件名，不只写含混“full hash”。例如Grok R3阶段04为b5192092…，canonical `character.png`/manifest为270ec635…，不是运行时版本漂移。

