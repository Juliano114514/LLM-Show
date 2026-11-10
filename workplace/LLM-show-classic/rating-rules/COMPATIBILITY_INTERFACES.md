# 当前角色的原生接口：显式作者输入

本接口共用于普通衣橱、导出与Review的 `classic-layers.mjs`。它不修改原生素材或原生100分基准，不证明任何新姿态已经98分。本轮只实现源码和staging；没有public apply。

## A：原生低位道具对应的AI上装/手臂

作者可在自己的profile中提供完整SVG：

```js
nativeLayers: {
  prop: nativeDisplayProp,
  top: {body: nativeTopBody, arms: nativeLowArms, bodyZ: 50, armsZ: 101},
}
```

`top`也可为包含完整衣身与手臂的单个SVG字符串。对象形式要求body、arms都真实提供且可见；没有自动沿用标准姿态手臂的分支。默认bodyZ50、armsZ101；z可由作者明确设置为0..120整数。单体top在top槽层级绘制。分层时须实际检查道具/发束/前臂前后关系，不能仅因默认z就认定接触正确。

`renderRemake`产出native-top PNG/SVG及各子层；root未来显式apply时保存top-native及子层，并设置 `variantRole:native-display`、`compatibilityPolicy:native-prop-top-v1`。只有当前AI top与所选prop.characterId为native时才使用它。hide只改变可见性，不改变所选prop身份；隐藏道具不会切回另一套手臂。两槽皆AI时仍使用标准立绘own top。完整native top会替换整套own top层，绝不叠加标准top-arms。

此top是作者选择的真实兼容姿态，**不自动证明全部15个原生道具都能正确持握**。每例仍须看接触点、手指和物体支撑并独立评98；不同道具位置不能靠无限延指或移动原生物解决。本轮不增加逐prop变体；确有必要时再按源指纹扩展。

无真实src/PNG hash、缺失子层hash或未提供新top的角色没有此兼容资格。当前没有flag的角色仍走原行为，不能退回历史standing。staging中使用冻结own SVG的渲染诊断只证明分层/选择路径，不是低位持物艺术稿，不能作为接入示例成品或直接apply。

## B：AI裙×原生腿的作者接触色簇

```text
node tools/classic-contact-interfaces.mjs gemini
```

读取真实冻结manifest、cfd原生池，写 `previews/classic-compatibility/gemini/` 中15源1x/4x前后图、输入模板和provenance。默认没有自动画影算法：所有模板 `enabled:false, placeholder:true`，不加入实际item，不改变family或v4签名，也不证明缝隙已修复。

作者在该目录另写authored.json，或在自己的profile.nativeLegInterfaces中提供同样的逐源记录：

```js
nativeLegInterfaces: {
  'native-lower-3': {
    enabled: true, placeholder: false,
    inputs: /* 原样复制当前templates.json的真实指纹 */,
    inputDigest: /* 对应SHA256，不能沿用旧bottom的值 */,
    regions: [[70, 156, 10, 4]], // 仅是语法示意，必须按该源实际衣摆确认
    maxDepth: 4,
    palette: ['#df9045', '#fdc68f'], // 必须来自该源或真实default可见腿调色
    contactSvg: authoredContactMarkup, // 真实非空色簇，不能启用透明模板
  },
}
```

检查冻结输入后可用 `node tools/classic-contact-interfaces.mjs gemini --authored` 生成候选；程序只读固定目录的authored.json。实际source/regions/palette须从真实图确认，示意值不表示适配所有源。

色簇不得用blur/filter/random noise。当前验证限制：1..4个原生坐标小矩形、总面积不超过192；实际色簇不超过96像素、最多4个原生RGB色、单色连续横段不超过8像素。像素必须落在真实腿或既有隐藏支持像素内，并在当前AI衣料下方最多4原生像素的接触范围。此限制仅约束来源和局部性，不是审美评分器；不合适的阴影仍可被独立judge否决。

产生的interface合成“既有derived hiddenPatch＋作者contactTone”，归AI bottom所有；允许覆盖混搭中的腿部接触处，但绝不改原生文件、原生originalFull或两槽皆原生的图。即使原hiddenPatch.pixels为0，真实已校验的作者contact仍可独立选中。两槽皆AI时不注入；没有有效opt-in仍原v4桥层行为。

## C：AI 上衣与原生裤裙腰线的作者接触

R15 `upper2` 五套实际组合确认相同衣尖在高腰牛仔、抬膝裙上仍需局部厚度。作者可提供 `profile.nativeBottomTopContacts[sourceKey]`；这与 A 的整套持物姿态分开，仅增加 z49 的局部翻边/压影，保留 own top-body50 与手臂。只有所选 bottom 为指纹匹配的原生来源时注入，hide 不改变该身份；全 AI 立绘与原生 100 均不注入。

`upperContactInputs(topBodyArtworkHash,native)` 输出有序输入 `{topBodyArtworkHash,nativeSourceKey,nativeSourceRawHash,nativeVisibleBottomHash,algorithmVersion:'authored-top-hem-clusters-v1'}`；`inputDigest` 为此 JSON SHA256。使用真实 top-body PNG，不能用 familyHash 或合并 top PNG。若 A 换成不同 body 子层，旧 C 不匹配，须另画，不能串用。

作者输入含 `enabled:true, placeholder:false, inputs, inputDigest, regions, maxDistance:4, palette, contactSvg`，工具 `renderNativeBottomTopContacts` 只做来源/局部性校验，不自动绘影。限制 1..4 个小矩形，总面积≤256、每矩形宽≤32高≤8、y104..160；实际≤96像素、单色横段≤8；≤6个精确RGB来自当前上衣或该原生lower。像素须在实际上衣边≤4像素并接近原生lower原件≤1像素。空模板禁用，输出 `authored-top-contact-candidate`、`ai-top-native-bottom-contact-v1`、PNG/SVG、源/摘要/作者记录。

`renderRemake` 保存各 source 的 top-contact PNG/design/JSON，显式 selected apply 才写 public。family 仅有效非空 C 新增输入/输出/z/policy；actualAiLayers 和 generatedInterfaceHashes 将 C 归 `AI top`，必须与原生组合共同独立评98，不能继承100或仅凭局部性校验宣称修好。root 对新 hook 的实际当前653组选择与56版族核对均0变化（尚无角色 opt-in，见 previews/classic-compatibility/root-audit/upper-contact-preservation.json）。实际作者图接入后另做真实15源/React审阅。

## B 与共同输入的版族

输入包含bottom自身PNG hash（不使用reviewFamilyHash）、native sourceKey/rawHash、真实unfilled腿hash、原隐藏patch hash、算法版本authored-contact-clusters-v1。inputKey为约定字段JSON，inputDigest为其SHA256；作者管线验证摘要，浏览器同步解析器逐字段匹配当前真实输入和inputKey。更换原生源、改底PNG或改算法不会挪用旧interface。

family payload保留旧 `{own, ownLayers, native}` 的键序；只对真实opt-in增加native-top子层/z/policy或active authored interfaces的输出hash、contact hash、inputs、digest。无flag或全disabled模板保持原family hash。interface输入不引用family hash，因此没有family→interface→family的循环。

## 真实证据与评分

actualAiLayers记录实际own/native-display、每个子层hash/z/compatibilityPolicy、接口inputDigest与source指纹，generatedInterface按 interfaceForSlot 归AI bottom或top、随AI98评审。仅所选AI组件有有效新policy时启用native-context-v5，绑定**全部实际AI层**的hash/z/role/policy；其余角色/组合保持原v3/v4。旧archive和已冻结无flag当前评分不会因安装hook而失效。

模板不启用、无真实contact美术时before/after应相同。不得把透明hook、来源校验或0像素差当作修复或98通过。原生lower仍同源originalFull显示100；原default与20体态样本不掺新接触层。root须冻结新角色资源、重新实际React截图并独立审阅后才能认可新兼容效果。
