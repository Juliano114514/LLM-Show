# Fashion QQ秀 · 第39轮收口：本轮评完即停

> 历史摘要，非下次评分依据。2026-11-10用户已删除整个results/archived，原归档位置的完整案例与停笔归档已不可访问；runtime和workspace仍有部分副本，具体可复核范围逐项核实。下文分数只描述当时报告，不代表现在已重新审过，不自动恢复被删归档。下一次从[现行评分入口](README.md)开始。

**最新用户指示是“这轮评完就停吧，整理好相关文件做好归档就行”。当前轮为已冻结的R39；原先到R40的计划已被覆盖，不再创建R40，也不继续准备R40艺术稿。**

R39本轮评审已收束：六份混搭、六份标准体报告和独立IAB账本均已发布，有效实审25个混搭案例。未审范围和缺陷按原证据保留，不宣称七位整套全部通过；本期停笔归档，不再继续绘制。

## 最新阶段边界

本期最多到当前R39。R39冻结输入不再艺术返修、重制或替换；只读评审其实际画面、核对源归属、整理既有文件和收口文档可以完成。Gemini的下一轮任务已撤销，作者确认R7未落盘任何修改、没有新草稿或后台导出；全部角色保留当前冻结输入。恢复绘制须由用户另行明确指示。

上限以全局评审轮次为准，与角色第几稿分开，不重编号、不覆盖旧轮、不建空轮。最新停笔授权以用户这条指示为准；[上限配置](../ai-workspace/state/iteration-limit.json)、[抽样器](../tools/remake/select-mix-round.mjs)、[冻结器](../tools/remake/freeze-mix-round.mjs)及其他规范由主代理同步归档，旧40计划不构成继续绘制授权。限额文件缺失或无效时拒绝继续的保护保留。

已核对：R39冻结session存在，R40归档session和冻结session均未创建。停笔是用户规定的阶段边界，未完成项不因收口补分，不将“已停笔”写成“已全部通过”。现行规则见[迭代规则](ITERATION_RULES.md)；[原40计划入口](ROUND40_CLOSEOUT.md)仅保留计划变更说明。

## 验收口径

| 项目 | 本期要求 |
| --- | --- |
| 原生组件及原生组合 | 恒为 **100 分校准**，不重新给原作品评级。错搭、缺块另记装配问题，不扣原生艺术分，也不转嫁成 AI 新缺陷。 |
| AI 原生融合 | 单件、多 AI 混搭、相邻接合及全套，实际已审案例的最低分均须 **≥98**；均分不能盖住失败。 |
| 全套立绘与设定还原 | 对照对应版本标准 JPG 和角色 MD，须 **≥90**。 |
| 标准姿态完整素体 | 独立融合 **≥98**，且 `poseConsistent=true`、独立报告通过；兼容原生姿态的 body 不能替代。 |
| 重大姿态差异 | 可见的抬垂臂、肘弯、腕掌/掌心、屈伸交叉、躯干倾斜与重心显著不符，必须扣分；关键差异使标准素体不得通过。遮挡部位保留未知。 |
| 对应颜色 | **只核色相相近**。具体色号、明暗/明度、饱和度、渐变曲线/范围、配色面积不用精确一致，不据此扣颜色还原分。 |

色相按头发、眼睛、衣料、耳角翼尾和持物的对应部位判断，不用未校色像素差冒充精确测量。低彩度中性色不强算色相。材质、体积和线条仍按融合项的独立证据审阅，不能借材质评审回扣已排除的明暗或饱和度差异，也不能用漂亮细节抵消色相或主要动作错误。DeepSeek 饭碗与吃饭是已授权定制，不免除其他姿态检查。完整细则见[SCORING](SCORING.md)。

## 人工评审基线保持冻结

用户提供的 `human_review_newest.txt` 针对任务开始时的 newest，并不自动指向后来提升到 newest 的稿件。[留存原文](../ai-workspace/workspace/reviews/20261110/human_review_baseline.txt)与当前原文已核对为同一字节，SHA256 为：

`542ccf6ea0d8394b4fd39bbbc91d8f3d8f867948563a8563a06ed4d0f79dca06`

[当时版本清单](../ai-workspace/workspace/reviews/20261110/human_review_version_manifest.json)绑定 GPT R19、DeepSeek R24、Claude R23、Grok R18、千问 R22、Gemini R20、GLM R21 及各自 inputHash；[人评适用说明](../results/newest/human_review_context.json)保留这一边界。

人评指出的发丝粗糙、衣料像贴纸、与实际肩胸腰胯及关节不呼应、漏肤，以及脸耳角形态问题，已纳入后续审阅。旧稿衣料约95/90/85以下等评价是基线，不给新稿沿用；评委旧高分也不能抵消人评指出的具体问题。原文、旧输入和新输入应同时可追溯。

## 原生数量与完整搭配

[原生目录（R38冻结）](../ai-workspace/runtime/review-rounds/round-38/catalog.json)实际为 **244 个按槽位几何去重的候选，涉及216个SWF来源**，保留14个换装主槽和7个解剖子槽。肩颈、左右臂、解剖掌指四个子槽目前各只有5种实际独立几何，未凑足10或18。244不表示244件完整商城商品，216个来源也不表示216套完整人体。

当前[抽样关系表](../tools/remake/data/native-sampling-compatibility.json)来自实际看图的 **245 个唯一身体/上衣/下装三元组，其中88组可用于完整着装抽样**，另有 **105组身体/鞋位关系**。证据分别见[衣装逐例审阅](../ai-workspace/workspace/research/native-completeness-20261110/outfit-compatibility.json)和[鞋位审阅](../ai-workspace/workspace/research/native-shoe-completeness-20261110/shoe-compatibility.json)。

抽样只取实际看过的三元关系和鞋位关系，不能将几个独立“通过列表”作笛卡尔外推。表与原生/模型及证据 SHA 绑定，来源变化后不沿用旧观察。**这只约束主审抽样，244个候选仍保留手选**；有问题的组合和旧轮反例留档，原生仍100。“不佩戴”是选择状态，不计作新增原生几何。流程见[PROCESS](PROCESS.md)。

## 找到的腾讯原装配机制及实现边界

已核对腾讯原站换装脚本和商品目录，机制是：

- 商品按完整物理层列表成组穿脱，并清理被替换商品的关联层。
- 下装参数 `iFStl` 指定腿姿，联动匹配的下身及鞋袜位移、旋转。
- 已声明的透明层仍占据身体槽位，阻止默认身体回填；它不等于文件缺失。官方商品1017290的透明406/436是明确例证。

因此，“已声明可见层”“已声明透明占层”“未知或缺失层”必须区分。CDN返回空文件本身不能证明商品声明过该层。完整来源与代码位置见[原站研究记录](../ai-workspace/workspace/research/compat-20261110/FINDINGS.md)。

1026698原421全图包含裙、腿与鞋，新恢复448含抱婴儿上装和整臂；但当前 `native-bottom-12` 已是去腿鞋的语义裙片，不能把当前缺口误写成运行时直接叠入整421双腿。该商品完整层列表和原腿姿仍未知。

**当前实现是原生语义组件池、既有鞋位绑定和观察三元组抽样，尚未完整移植腾讯原商品层组/透明占层的换装事务。** 观察白名单不是官方商品元数据，也不意味着任意手选都兼容；不能把找到原代码写成全部运行时兼容已解决。

## 独立绘制、IAB呈现与真实覆盖

七位角色分别由专属 artist agent 修改其角色模块，独立 `fashion_judge` 审阅评分。并发限制可以分批执行，不能省略某位的专属绘制角色；绘制者不自报通过。主代理负责共享工具、原生装配与反馈调度。

本期使用内置浏览器 IAB，以本轮冻结 `session/catalog/model` 调用 `visualLayers` 和 `standardMannequinLayers` 实际叠 SVG，包含鞋袜变换。不能把离线合成 PNG 放进网页就算真实叠层验收。所有图像解码、组编号和 ready 状态均确认后才取证；载入失败、旧组残像、截掉人物/关节的图不计覆盖。

呈现者与评委可以分工：主代理真实操作 IAB 并保存截图，独立评委逐张审阅这些截图及必要原源。报告分别写明操作者、审阅者、查看器 SHA、冻结绑定、截图 SHA、实际 case ID 和未覆盖项；不能声称无 provider 的评委亲自操作了浏览器，也不能将“已生成”“已截图”自动记成“已审”。离线证据只增加其实际覆盖的辅助范围。

每角色固定混搭矩阵为：

| 内容 | 案例数 |
| --- | ---: |
| 21槽 × 5上下文 | 105 |
| 10相邻对 × 5上下文 | 50 |
| 18多AI组 × 5上下文 | 90 |
| 全套AI对标准图 | 1 |
| **混搭合计** | **246** |

标准素体另有 **7固定视图、20原SVG参照及直接SVG的6x细节**，独立计数，不混进246凑数。原20源含局部和着装，不叫20套裸体。标准体使用同版完整 body、裸掌和头脸并保留 paint 顺序，不另按统一顺序重排解剖分件。七组标准对照及6x在浏览器的实际呈现、审阅与未知关节均须记录。详见[标准素体审阅](STANDARD_BODY_REVIEW.md)。

一个五上下文截图，只能覆盖实际清晰呈现且由评委审阅的五例。案例集合须去重补缺；点击次数、截图张数、同SHA或少数关键接面通过，都不能外推整套通过。

## 旧通过、保护与补审纠正

保护已通过部件是控制改动范围，**同SHA和旧98不免审**。确认旧漏审时保留原报告和原图，另立补审记录，说明发现轮次、原输入、完整原生对照、裁切/变换、问题坐标及其对当前验收的影响；既不篡改历史，也不继续把旧 accepted 当成当前无缺陷的证明。

[七位标准接面IAB补审](../ai-workspace/workspace/reviews/20261110/r38-seven-standard-iab-supplement.md)记录了 GPT/Grok/千问的既有左肩问题，以及 Claude R34 双肩旧漏审。R39定向报告已确认上述四位所列旧肩缺陷解除，但这不补齐R39整套验收。该历史补审除DeepSeek已有完整报告外，其余每人仅覆盖各自标准细节，不能冒充他们的246浏览器验收；GLM掌遮住部位仍未知。

返修前应一次检查双侧可见肩、肘、腕掌及腰髋膝踝，不只修上次指出的一侧。原母件固有画法仍100；本地重组导致的悬帽、双线、开缝等归当前组装，不能删原线或靠衣服遮住代替接合。按最新用户指示，本轮评完后的新发现只登记，停止自动绘制返修，不进入R40。

## 已核实的完整结果：DeepSeek R38

DeepSeek R38的[已发布记录](../ai-workspace/runtime/review-rounds/round-38/reviews.json)为 `accepted=true`，独立融合 **98**、立绘还原 **90**、标准体 **98**，`poseConsistent=true`；混搭 **246/246** 实审，标准 **7视图/20原SVG＋6x** 齐备。

其冻结输入为 `48e84b66116e18214eab3d7a03562277c57de1063f007d98f438315df9e06207`。这是R38结果，不自动改称R39新成绩，也不外推未生成的任意组合。

- [独立混搭与身份报告](../ai-workspace/runtime/review-rounds/round-38/evidence/deepseek/review.json)、[标准体独立报告](../ai-workspace/runtime/review-rounds/round-38/evidence/deepseek/standard-study/review.json)。
- [真实IAB取证清单](../ai-workspace/workspace/browser-review/r38-browser-manifest.json)，SHA256 `81aeb2492e8b5e488efc1bbfe575a0e071d18e083e566cc07ca7771028213009`。
- [独立浏览器截图审阅账本](../ai-workspace/workspace/reviews/20261110/deepseek-r38-browser-independent-review.json)，SHA256 `830da80a57077c7f41ad80a399bf16bd2b4d23a6669638eb7b1c55610702fe89`。呈现者 `/root`，独立审阅者 `/root/fashion_judge`，实际审阅58组；评委未宣称亲自控制IAB。

以上两份清单的实际字节与报告引用SHA已核对。保护该通过输入，不为凑轮次改好件；任何新输入仍须另建真实验收记录。

## R39最终部分评审与未审边界

第39轮已评完并发布六份混搭与六份标准体报告，见[最终独评收口](../ai-workspace/workspace/reviews/20261110/r39-final-independent-closeout.md)、[逐报告SHA清单](../ai-workspace/workspace/reviews/20261110/r39-final-independent-closeout.json)及[已发布结果](../ai-workspace/runtime/review-rounds/round-39/reviews.json)。有效实审为25个唯一混搭案例，六位计划矩阵合计1476例；未审不补分，六位均 `accepted=false`。

此前[定向初评](../ai-workspace/workspace/reviews/20261110/r39-priority-target-review.json)保留原字节，其中“供40最后局部修正”和 round40Recommendation 只反映出报告时的旧计划，已被最新停笔指示覆盖，不再执行。Gemini专属agent确认R7尚未落盘任何修改，没有新私稿或后台导出；当前艺术仍为R6/39，不存在另一个未冻结40稿。

- GPT头饰/骨角根、千问上衣挂袖根、GLM尾部effect：各5例定向98，仅这些实际案例通过。
- GPT、Grok、千问旧左肩与Claude旧双肩：定向6x及原源对照确认旧接面问题已解除；不据此签发新的完整标准98或整套接受。
- Gemini back尾部：5例定向97。上根到主S约x69–78、y140–152仍有宽斜带/三角接片，毛向与体积覆压不连续；下弯也有分段纹场。保留缺陷停笔，不因截止抬到98，不执行旧40返修建议。
- 本轮六份身份分由独立评委重新实际看当前JPG/MD/成装给出，不沿用旧分。Gemini身份90仅为离线辅助判断，其完整allAI浏览器位图无有效取证，不能计作已审第6个混搭案例。
- GPT标准体7固定视图、20原SVG及6x完整实审，98、pose=true、pass=true。其他五位只完成6x/局部对照，所见局部评分98，但标准覆盖不完整、pass=false；不能把“局部98”写成完整标准体通过。

独立评委已逐张看完原57张返回截图，56张有效、1张Gemini allAI载入中且JPG半截；去重后有效混搭25例。实际覆盖以[独立IAB账本](../ai-workspace/workspace/reviews/20261110/r39-browser-independent-review.json)为准，SHA256 `a949c65f71c4969ae53d7c925c696120cd5afadecac760facf1b41e068010113`。呈现者为root，审阅者为fashion_judge，评委未声称亲自操作IAB。

主代理的[原始取证清单](../ai-workspace/workspace/browser-review/r39-browser-manifest.json)不改写；另以[失败位图排除账本](../ai-workspace/workspace/browser-review/r39-browser-exclusions.json)排除原坏图及三张仅头栏的失败补取图。原清单中的“已截图”数量不能直接当成有效已审数。实时UI完整或DOM为ready，也不能代替保存位图的完整性。

R39绑定seed为 `9c5e924fd7eed5dd3b28816c32ca506197ab565f8af5586e`；[冻结session](../ai-workspace/runtime/review-rounds/round-39/session.json)保留各角色输入、native/model、随机组及来源。局部目标结论不等于完整246覆盖。

## focus正常视窗取证与失败排除

IAB fullPage接口反复失败时，采用现有正常视窗取证，没有设置viewport覆盖。新查看器支持 `focus=N`（0基）：只呈现当前组一个article，实际caseCount为1；不带focus的默认全组模式保留。组57的focus0/1/2为同一冻结SVG6x的三条 **840×452** 横带，y分别为 **0、452、904**，原画层始终840×1356，仅平移裁取，不压缩缩放；三带合起来覆盖1356高度。单带不能代替完整6x覆盖。

新查看器保留完整input、seed、native/model/session SHA、组与案例ID、focus/part及decode后的ready。原源码版本与截图继续留档，不被新模式覆盖；新源快照为[HTML](../ai-workspace/workspace/browser-review/viewer-snapshots/35a32b7b1a5bba0c68105b6293b057e7c4e3f93af058e0936696d936175f5b1e/browser-audit.html)与[JS](../ai-workspace/workspace/browser-review/viewer-snapshots/a8a4acc709606a80d205063bc4e51644a11ae455a31bc2aa88ab6daa6226915d/browser-audit.mjs)，各目录名即原字节SHA。

失败请求、错误clip原点、旧组残像、未解码或截断人物的图均不计覆盖。成功普通视窗截图也须由独立评委实际看过，并按具体case或横带去重登记；不能按请求次数、截图张数或已生成文件数补齐246、7/20或6x。

## 本期停笔状态表

下表为已发布的实际结果；“融合”仅为已审案例最低值。除GPT及受保护的DeepSeek外，标准98均仅为所见局部评分、未完整通过。本轮评审已收束，保留未审与缺陷停笔，不开40。DeepSeek完整接受仅对应其受保护的R38输入。

| 角色 / 冻结轮 | 已审融合 / 还原 | 混搭有效实审 | 标准素体 | 停笔结论 |
| --- | --- | --- | --- | --- |
| [GPT R39](../ai-workspace/workspace/reviews/gpt-mix-round-39.json) | 98 / 91 | 6/246 | 98，完整7/20＋6x，pose=true，通过 | 角根与旧肩问题解除；整套覆盖不足 |
| DeepSeek R38 | 98 / 90 | 246/246 | 98，完整7/20＋6x，pose=true，通过 | **完整接受，保护原输入** |
| [Claude R39](../ai-workspace/workspace/reviews/claude-mix-round-39.json) | 98 / 91 | 1/246 | 局部98，未完整通过 | 双肩旧问题解除；整套覆盖不足，不沿用R34 accepted |
| [Grok R39](../ai-workspace/workspace/reviews/grok-mix-round-39.json) | 98 / 93 | 1/246 | 局部98，未完整通过 | 旧左肩问题解除；整套覆盖不足 |
| [千问 R39](../ai-workspace/workspace/reviews/qwen-mix-round-39.json) | 98 / 91 | 6/246 | 局部98，未完整通过 | 肩与挂袖根解除；整套覆盖不足 |
| [Gemini R39](../ai-workspace/workspace/reviews/gemini-mix-round-39.json) | 97 / 90（身份仅离线辅助） | 5/246 | 局部98，未完整通过 | **毛料接界缺陷保留，未通过停笔**；allAI浏览器取证缺口保留 |
| [GLM R39](../ai-workspace/workspace/reviews/glm-mix-round-39.json) | 98 / 90 | 6/246 | 局部98，未完整通过 | 尾体积目标解除；被掌遮住处仍未知，整套覆盖不足 |

当时已更新最新三版共21个角色快照并完成归档；随后用户删除了results/archived。该归档现不存在，不再提供失效入口，也不自动恢复。仍可用的资料逐项核实，缺失证据标为不可复核/待新审，不篡改历史分或把摘要当当前通过证明。后续是否评分或恢复绘制以新任务指令为准。
