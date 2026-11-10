> 下次评分先读 [统一执行口径](NEXT_REVIEW.md)。本文件中的R25/R26、本期停手及旧归档描述仅属历史，不自动延续；证据已删除时须重新取证。

# 随机审阅与取证流程

本期按用户最新要求“这轮评完就停吧，整理好相关文件做好归档就行”，完成当前R25的七人内置浏览器独立复评后整理归档并停手，不执行R26。此前两轮计划已被覆盖，保留为历史。计数、台账及未通过时的停止方式见[本期收尾规定](TWO_ROUND_CLOSEOUT_20261110.md)；下述证据范围和98/90门槛保持。

## 1. 冻结当前绘制版本

各角色模块为`tools/classic-remake/{id}.mjs`。作者只写自己的模块和私有revision；root核作者已停笔后统一导入，不能全量import正在修改的其他作者模块。以下命令工作目录为`D:/LLM-show/LLM-show-classic`，角色名单仅为示例：

```powershell
node tools/archive-classic-runtime.mjs
node tools/remake-classic.mjs gpt deepseek glm --apply-selected --render-root=ai-workspace/previews/classic/remake/apply-import-r25
node tools/build-classic-native-review.mjs --reuse-native-pool
```

`--apply-selected`显式命名1～6位已停笔作者，只import/render这些人；七位全部已停笔时才可用全量`--apply`，两种flag互斥。`--render-root=`是可选的独立导入目录，须位于项目`ai-workspace/previews`内，批次应清楚可追溯；默认导出API保持原行为，body/construction指针必须跟随实际输出。旧预览被占用时保留旧图并生成新批次，不拿旧construction冒充新稿。

导入后用`tools/record-classic-selected-freeze.mjs`记录前置归档ID与本次冻结JSON，核未选角色metadata/items和逐文件SHA不变、原default逐像素差0、五个源哈希未变、七人运行时完整、原生pool/corpus不变。selected apply不刷新七人总作者板/gallery，以免读取其他作者草稿；这些总板可能历史，正式评审以冻结运行时和实际React为准。

当前原生为217件：10槽各20件、背饰17件，保留扩容前165件的PNG字节与来源。新增下装的源同坐标重合成与独立QC继续留档；普通美术改稿复用`--reuse-native-pool`，不要无故重建原生池。确需改池时另核真实性和完整性，poolHash变化后重新取证。当前工作索引为`ai-workspace/previews/classic/remake/HUMAN_FOLLOWUP_STATE.json`，具体版本以manifest及冻结记录为准。

裙腿同源联动，`native-complete-torso-v1`按真实源alpha检查中央躯干连通，减少缺块；它不证明所有全身组合、手掌、发脸及衣料接触均已自然。不得按AI成绩筛seed、排除难样例或降低原生100。

源专属mask或隐藏补片有变化时，先独立QC新增露出部分。同源重合成0差只说明原衣物遮住了修改，不能替代自然体块审阅；新增桥接或补画属于AI接口，绑定哈希评98，不继承原生100。

archive工具保存已apply运行时及原生池所引用的准确PNG/SVG/GIF/Markdown、清单和评分，逐文件SHA核对。位置为`results/archived/runtime/{archiveId}/public`；原URL在该public根下定位。运行时归档、作者源码快照和真实React截图分别保留，不能互相替代。

`manifest.remake.characters`保留completeHash/bodyHash/artworkHashes及冻结bodySrc/bodySvg；各AI槽及ownVariant含artworkHash，body副本带bodyArtworkHash。builder优先取已apply PNG，只在哈希匹配时允许cache/作者preview恢复，绝不把未apply草稿当本轮body。`tools/freeze-classic-review-bodies.mjs`仅恢复与已apply哈希相同的中间产物。单部件不能只绑定成品hash，因为被衣裙遮住的修改未必改变成品。

## 2. 从内置浏览器实际React发起一轮

**正式验收仅使用Codex内置浏览器（IAB）的真实React页面。** 入口示例：

```text
http://127.0.0.1:5173/?review=1&character=gpt&slot=hair&aiSlots=hair,face&seed=<本轮新随机seed>&arrangement=0&mode=component&scale=1&surface=light
```

若打开工具返回`queued`，只说明请求已排队，不能记为页面已可见或取证成功。先等待本聊天显示并核实际tab；确需用户操作时，说明工具状态并请其切回本聊天、展开右侧浏览器，不重复请求已授权的验收许可。本次用户确认“页面已打开”后恢复了IAB控制，后续仍按实际页面状态判断。

按nativeCounts各槽实际库存无放回抽5；裙腿同源，上衣依据源alpha连续性图与下装共同复排，其余槽独立。约束不读取AI图或AI分数，也不重抽有利seed。相同seed＋poolHash复现相同draws；正式新一轮换seed，arrangement只是复排固定抽样。

五套纯原生始终100，每套对应同时替入所选AI集合。窄窗（1100px及以下）按每例左右配对，宽窗维持原生上行、AI下行。展示位置不改seed、draws、图层、case ID或分数；截图按实际可见`data-case-id`与`data-kind`计覆盖，不能假定一张窗口图已含五对。

单件只作诊断。正式多件用`aiSlots`或九组预设：`head2/body3/figure5/nearFull8/scene3/accessories3/upper2/skirt3/stride2`，每组每轮抽五套新上下文并保守取最低98。每个selected item须命中本轮资源，记录所有actualAiLayers和完整reviewedPartHashes，不能只force一件；至少保留一个原生槽。适用集合及接口要求见[ACCEPTANCE](ACCEPTANCE.md)。

当前ownVariant与本轮native-display通过共享resolver选择，排除历史standing；没有本轮native展示变体时用当前own。已确认空槽保留预设key、实际数量和`presetExclusions`。Claude、Qwen的独立back为N/A，不能以空图或移除原生背饰授98。

`mode=body`保留default对照，默认抽20例中的5例复查；`corpus=all`展示全部20，最终必须覆盖全量。bodyCorpus独立hash，不因补充素体语料无故改component池。

`inspect=1`追加同seed、同实际层、同坐标的所选部件分离图，仅供无遮挡诊断，不替代完整混搭评分。遮挡补查可用`hide=aura,effect`或界面勾选，只隐藏未选为AI的原生装饰；不能隐藏目标AI，至少保留一个可见原生槽。原seed/draws不变，excludedSlots改变contextSignature，须同时保留原完整混搭。补图不能洗掉目标AI引入的接触/遮挡问题。

## 3. 验证页面证据对象

从当前页面“本页实际选择与图层证据”的`pre[data-review-evidence]`读取DOM中的JSON，或用页面导出按钮；不以与当前DOM无关的隐藏应用状态代替页面证据。

- `artworkApplied`包含当前角色冻结记录，`artworkFamily=classic-body-first-remake-v1`，body副本就绪。
- `coverage.nativeItems=217`，nativeCounts逐槽匹配，图像加载完成、`naturalWidth>0`、`failedImages=0`。
- seed、poolHash、draws、contextSignature、每例nativeSelection/aiSelection。
- baselineLayers、aiLayers、actualAiLayers及每层真实PNG hash/variantRole，确认本轮主体来自`/assets-classic/{id}/remake/`；场景可保留现行AI路径。
- reviewedPartHash、reviewedCompleteHash、bodyHash/bodyCopyHash及完整selectedAiSlots/reviewedPartHashes；上下文签名须包含集合。
- bodyCorpus总数、所选ID、bodyCorpusHash、corpusSignature、看5或20的实际范围和逐样例记录。
- 新增generatedInterfaceHashes和逐源接触接口须完整绑定，不能只看共用主体hash。

component、full、body分别留证。full页面同时核normal、角色Markdown、全套与独立body；body页面核本轮专属素体与原生对照。读取预期版本时只输出必要的`{id,bodyHash,completeHash}`摘要，避免工具截断巨型接口对象造成解析失败；完整指纹仍留在原证据和manifest。

## 4. 保存真实内置浏览器图像

本期实测IAB的`fullPage`截图不可用，采用单张串行的视口截图分段留图，配同一时刻DOM证据。每段记录视口、滚动位置、可见矩形、case/样例ID和PNG SHA；后续工具能力若变化，须重新实际验证，不沿用旧的fullPage承诺。不得用作者离屏合成冒充浏览器证据，也不为塞下矩阵任意放大视口。

1×用于原生像素实审，整数倍补看细节；不变形放大。full三幅图须完整覆盖；component合并实际可见范围覆盖五个native和五个AI；body保存default原生/AI完整对照及全部20个ID。重复case不增加例数。例图不足时继续分段，不能只凭截图尺寸或工具成功响应判定覆盖。

### 逐张核对实际位图（本期补充）

本次已证实：同一次CUA调用里批量滚动、连续截图可能复用上一张位图。DOM已经ready、`naturalWidth>0`、`failedImages=0`或metadata声称目标可见，都不足以证明回包PNG就是该目标；不同SHA也不能单独证明内容正确。

- 滚动/定位与截图分开，**每张截图独立一次CUA调用**。截图回包后实际打开PNG核对，确认正确后再前进，不能在同call循环中批量滚动截图。
- body图读取实际`#01–#20`标题，并核原生人物/服装/姿态身份与冻结corpus一致。只露出目标标题而没有目标完整人物，不能计作目标覆盖。
- matrix图核实际“原生N”、对应fixture和footer原生部件ID，逐项对照case/nativeSelection，并确认原生与AI两侧对应同一上下文；不能仅信DOM visible ID。
- 实际编号/身份确认写入`rasterConfirmation`等记录后才可计有效范围。相同SHA被赋给互斥ID时应触发内容复查，但错位结论仍来自实际PNG，而非只由哈希推断。
- 失效PNG、原metadata、SHA和不一致原因保留，标记`validForReview:false`；按相同seed、context、当前艺术hash补图，记录替代关系。技术补证不另计美术修改轮数，也不改变美术评分或清历史问题。

R25实际例证见[截图内容审计](../ai-workspace/previews/classic/remake/react-review/human-followup-20261110/round-08/evidence-audit/audit-results.md)：四角色140张仅在该报告指定的编号/身份/fixture/footer范围核对；Qwen旧13张中3张确证错位，整批退为诊断，再按同seed串行补采。新批次与后续角色必须另核，不能外推旧QA覆盖。

文件可组织为：

```text
ai-workspace/previews/classic/remake/react-review/human-followup-20261110/round-NN/{id}/
  full.png / full-evidence.json / full-segment-*.png
  head2.png / head2-evidence.json / head2-segment-*.png
  body3.png / body3-evidence.json / body3-segment-*.png
  upper2.png / upper2-evidence.json / upper2-segment-*.png
  body-evidence.json / body-default-*.png / body-strip-*.png
```

截图后实际打开检查内容。视口或版本在取证前后移动/改变的截图不计有效覆盖；失败、不完整图保留为诊断并明确标识，不能充作完整五对或20例。`invalid-uid-crop.png`等旧错误图继续作废。

root保存IAB原始PNG字节及同页证据，独立评委实际查看这些确切文件。外部Chrome旧图保留其历史来源，不能改标为本轮IAB；旧Chrome裁图、保存路径和fullPage说明不作当前能力承诺或本期替代路线。不得启动未经授权的外部headless浏览器、改安全配置或把巨量base64嵌入可执行脚本。

观察超时不表示tab、进程或任务已终止，应复查同一handle或其他权威状态，不能仅凭超时重新选择浏览器、重启服务或重复创建页面。正常连接沿用当前browser/tab；确有缺失或会话重建时按实际inventory重新绑定，不沿用失效tab闭包。

## 5. 独立评分与回传

独立评委先看20张原生女性样本、选定normal及角色Markdown，再看当前IAB真实图与哈希。融合每组五例按SCORING权重计算、保守取最低98；body保留default与20例逐例判断并取最低98；全套还原90另评。原生100不改，作者不自授验收分。

正式记录重点包括：肢体/掌跟饱满自然、衣料受力和压叠厚度、发型/刘海与衣服的还原和融合、Blingee华丽且层次清楚、对应色相接近、非常显著pose差才扣还原。原生式紧凑指群/角阶/负形不套写实标准；书碗柄与悬浮物/立式麦克风/装饰先辨真实语义。尺寸判断遵守SCORING可感知5%的适用边界，不把default两点宽度设成所有姿态目标。

回原作者的包须含：尤其是原生组合图、AI对照、完整selection/实际源、seed/pool/contextSignature、各维/逐例分数、反对理由和坐标、具体建议、标准图/Markdown核对、版本与接口哈希。不能只发“低于98，请改”。常规迭代可先定位`head2/body3/upper2`的明显失败回修；本期R25评完按最新指令停手，仅记录缺陷与建议。其余六组未审时明确pending，不能外推全部九组通过。

## 6. 修改后复评与未变范围携带

新增素材须核实际服务响应：正确image MIME/字节、加载完成、naturalWidth与failedImages。历史上出现过磁盘有图但HTTP200返回SPA HTML的故障；当前`../frontend/workspace-files.mjs`动态解析受控运行时路径并核真实文件，不能保留“每新增图必重启Vite”的旧做法。技术失败先查当前响应与源，保留失败证据并按相同seed/draws重采；艺术失败的新一轮按当前217件池取新seed，不换有利组合洗分。

Windows实际文件锁须先核目标、已写入范围、归档及进程状态。确需短暂停止本任务自建Vite以完成目录轮换时，先核PID/命令归属，记录实际错误、处理原因并恢复监听/页面；不关闭用户应用、不改ACL、不以观察超时作为重启理由。旧预览占用可用独立`--render-root=`生成新批次并保留真实路径。

`tools/classic-frozen-capture.mjs`只匹配证据范围，不生成新分。携带原分时保留原seed/context、原图/SHA、原报告及matchingScope，包括原失败；不把携带说成本次新seed、新full或新技术清关。

| 范围 | 必须匹配 | 边界 |
| --- | --- | --- |
| 共同前提 | character、poolHash | 旧池不能冒充新池 |
| full | completeHash、bodyHash | 改头后旧full不证明新全套 |
| body | bodyHash、bodyCopyHash、bodyCorpusHash | 仅头变可携原default＋20，不改称新截图 |
| component组 | 全selectedAiSlots及每个reviewFamilyHash完整map | 任一所选版族变化重审，不能只比较一张own PNG |

换body hash不自动清旧形体问题；方法纠正与几何修复分别留档。旧不利主线/窗口、源/目标/控制、原结论及未知区域保留，明确指向当前/历史hash；未确认的方法疑项不指导盲削肉面。

`node tools/sync-classic-review-scores.mjs`只导入独立报告、核算既有维度的算术，不生成审美分；`classic-acceptance-status.mjs`按当前body/complete/family/pool/corpus及实际证据聚合。`revision-required`表示有当前真实低分，`pending`表示证据/报告未齐，全部必要范围通过才为`passed`。同版本其他seed的失败不被新合格样例洗掉。

最终通过仍要求适用九组各五例98、default＋20全部98、全套90和必修形体问题闭环。本期当前R25评完即按用户要求停止改图、整理归档并暂停目标，即使仍未满足；保留未通过/待审、未覆盖和后续建议，不执行R26，不标目标已达成。

## 7. 历史回放与结果归档

`review=1&archive={20位小写hex归档ID}`读取`results/archived/runtime/{id}/public`，实际URL前缀为`/LLM-show-classic/results/archived/runtime/{id}/public`。保留原manifest、native-review、scorebook、素材及body/complete/part/pool哈希，导出runtimeArchive并提示历史回放。不能刷新新池冒充旧seed；历史回放不作当前主验收证据。

旧问题的遮挡补查保留原seed、draws、AI版族及完整图，只在原生/AI两侧同样隐藏非目标装饰。以`supplements.originalContextSignature`关联原证据，补图只增加细节，不替代完整Blingee场景或表示新稿通过。旧R2归档及Chrome/fullPage补图保留原始目录与来源，不升级为本期IAB能力或新版本证据。

每个完整候选先精确archive，再用`tools/freeze-classic-results.mjs`导出七人全览、逐人src/rating/rating.json，轮换`results/newest/new/previous`；旧版移入archived。复评后只用`tools/refresh-frozen-classic-ratings.mjs`刷新精确匹配的冻结评分，不改已冻结艺术字节。目录轮换失败先核已经移动的步骤与版本ID，保留可恢复版本再续作，不盲目覆盖目标目录。

最后更新本期收尾台账、实际分数、已改善项、未通过/待审/未覆盖及旧技术问题。原始人类意见仍只绑定R19，后续反馈不套用旧分数。当前R25复评结束后只整理归档并停手，进一步改稿等待用户重启。未采用的GPT16、DeepSeek10、Claude12、Grok13和被中断的Qwen11已单独保留在未采用私稿归档（历史文件已不可用），不导入、不验收、不计已完成轮；七人作者模块已恢复R25精确冻结源码，运行时/newest艺术未变。

## 8. 截图必须实际显示本轮画面

DOM已出现证据、图像加载检查为空、哈希与坐标匹配，都不能单独证明截图已绘出角色。每张正式PNG仍须实际打开，确认正确的原生/AI组合、样例编号和完整体块。新页面导航与首张截图分开调用，先确认页面状态，再取首图；不能把加载页位图与已经更新的DOM拼成有效证据。

本期DS9的head2首例曾真实抓到加载页，独立评委据PNG指出后，保留原图和SHA，以同seed、draws、contextSignature、部件/身体哈希补采不可变segment06。旧segment明确写validForReview:false及原因，原DOM可见观测保留；新补图关联被替代项。有效覆盖和正式评分排除失效位图，字段语义不能写反。

这类补证只修取证故障，不是新的艺术修改轮，也不允许换样绕过低分。恢复后由评委实际打开补图，再补齐对应例评分；未补齐时该例和组保持待评。完整五对与default＋20覆盖以有效实图核对，不能只对DOM计数。
