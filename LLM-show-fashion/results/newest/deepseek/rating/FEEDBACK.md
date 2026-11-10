# deepseek · 第38轮完整反馈包

融合度：98 / 门槛98。立绘还原：90 / 门槛90。

须同时实际查看下面原生与AI图，再按独立评审返修；不能只看分数。

## 原生100校准组合

- [原生组合1](native-1.png)
- [原生组合2](native-2.png)
- [原生组合3](native-3.png)
- [原生组合4](native-4.png)
- [原生组合5](native-5.png)

## 对照、标准图与设定

- [完整案例、来源、哈希、随机种子](cases.json)
- [独立评分与具体反对理由](independent-review.json)
- [全套AI / 标准立绘](identity.png)
- [角色Markdown设定](reference-notes.md)
- `components/`：21组原生/单AI与孤立组件对照。
- `pairs/`：10组相邻AI组件接合。
- `multi/`：18组原生+若干AI组件，每组五种上下文。

## 具体失败与修改意见

- 本轮实际246/246混搭均达到98（同源原件一致者100），标准7图/20源+直接6x全部复核98，pose=true，身份90。建议冻结保护通过资产。

- 本结论只覆盖R38该input、seed、5原生上下文及246矩阵，不外推全部原生池或其他未生成姿态。

- 本人IAB provider不可用；root在实际内置浏览器呈现冻结SVG并取证，我逐页审阅58张稳定full-page截图。最终浏览器manifest及每case绑定单独落档，不冒称本人操纵浏览器。

## 标准姿态完整素体（另审，不被兼容件100替代）

- [标准完整素体与5原生](standard-study/standard-body-contexts.png)
- [标准立绘与素体动作](standard-study/standard-vs-reference.png)
- [原SWF对照第1页](standard-study/standard-vs-20-1.png)
- [原SWF对照第2页](standard-study/standard-vs-20-2.png)
- [原SWF对照第3页](standard-study/standard-vs-20-3.png)
- [原SWF对照第4页](standard-study/standard-vs-20-4.png)
- [固定输入/原始覆盖/全部图SHA](standard-study/study.json)

- [标准素体6倍原矢量细节：逐处核对关节接面](standard-study/standard-mannequin-6x.png)

独立标准素体融合：98 / 98；姿势神似：true。

- [素体独立评分与修改意见](standard-study/review.json)

## 输入版本

- protocol: fashion-react-mix-98-90-v2
- inputHash: 48e84b66116e18214eab3d7a03562277c57de1063f007d98f438315df9e06207
- nativeHash: d68eec334e39f69a89bd6c05fb8c91a56a781df2a353bcc97ceb59ac3d34fabc
- renderModelHash: bd645ead9f9041972be16a1c120cef2046c9b524ae3c311505e501af29685d28
- seed: 550fabe837f9193ed52060cc715e66ba2f16de614c3c4765

本轮图与源输入保留。下轮新随机抽样，同时复查本轮明确失败接口；不得降低门槛或用别的原生服装替换AI设计掩盖问题。
