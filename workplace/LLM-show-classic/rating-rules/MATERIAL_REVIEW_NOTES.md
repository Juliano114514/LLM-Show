# 材质与面部复审笔记

正式分只来自独立reviewer的完整React配对评审，本页只保留已确认异议、源图观察与后续绘制线索。原生完整组合固定100；不能通过降低它们的分数给AI过98。以下局部图不替代完整Blingee/pixel background场景。

## 当前源层并排脚本

`node tools/inspect-classic-head-pigments.mjs {character} {round-NN}`读取该轮真实head2-evidence中的五套native/AI层，逐个核PNG SHA，按真实z合成，只截同坐标头部与面部、最近邻放大，不读可变作者module。输出在`previews/classic/remake/acceptance/{round}/{character}/head-pigments/`：`face-6x.png`、`head-3x.png`、`inputs.json`。这是可检查的补充诊断，不是新的浏览器验收，不产生审美分。

已实际为GPT R4/round07、Qwen R3/round07、DS R3/round04、Claude R3/round05、Grok R4/round08、Gemini R4/round03、GLM R4/round09生成，分别核26或27个输入层。改稿后旧crop与其输入hash一起保留，不叫最新。需要历史输入时用对应原封归档，不把当前新图替入旧评审。

第二版补上两行真实native top/neck以保持下颌alpha的实际衬底，新增`face-with-native-neck-6x.png`、`head-with-native-neck-3x.png`和`inputs-with-native-neck.json`，核36或37层，第一版不覆盖。不含真实颈肤的分离图可能改变下颌半透明边观感，不能只据它断言接缝。必须回到实际混搭与正确源层核实。

## 原生脸部色簇不能被“套原生眼”替代

root实际查看GPT R4五组并排，观察到AI脸为大块浅肤、灰紫眼块与短横口，原生五脸仍有清楚黑睫/暗瞳/眼白、鼻颊唇的局部暖面。此为未评分的具体视觉观察；正式round03旧GPT head2为94.75，新R4头部尚须独立评分。

`defaultHeadPlane()`有意清掉内部表情，适合保留mannequin头缘；不能据此推导成妆面部已98。移植原生眼后若按y把整个深色眼区染成紫条，也可能同时抹掉暗瞳/睫沿，应按真实虹膜、瞳孔、睫沿与高光分别保留色簇。建议使用实际原生面部受光和表情组织作为笔触参考，准确调整角色虹膜/唇弧，不能所有角色共用空白脸加两个色块。

root也实际查看Claude R3与GLM R4并排。Claude已有较清楚的睫瞳层，鼻颊口仍较平；GLM困倦半闭眼闭口是已授权特征，必须保留，可修睑缘/眼白/鼻唇短暖影，不能为追原生大眼就机械睁眼。不同角色神态以normal原图+对应md+用户确认共同判断。

GPT R4 body c803232d…已独立通过98。面部妆容是独立face部件，后续可改face而保持已接受body及其头缘逐像素不变；不能顺带全局改共享head函数使已接受素体漂移。

## Gemini R4清嘴矩形制造了下唇橙横带

root从真实round03 face PNG与native face-1逐像素核实，补真实颈肤后仍可见：新脸y82/x64–75整行约`fec78f`，y83/x65–74整行约`df9147`至`da8e45`；原source中段本是`fbdabb/fde7cf`、`fbdbbb/fce5ce/f0dac4`等局部肤面与粉唇。原因是清嘴代码对x64–75/y78–83全矩形按该行x63/x76端点插值，而y83两端已经在半透明橙色下颌边，把外缘色反铺到内脸。

这不是头发色、透明背景假RGB或“水平姿态就错误”。已反馈Gemini R5收尾修：只清真实粉唇/白口形，用内侧实际嘴周肤面转接，保留非唇原生下颌/下唇短暖影和alpha；不能把外轮廓颜色填满盒子。保留玫金异瞳和小闭口神态。直接图在acceptance/default-face-native-8x.png、gemini-r4-face-only-8x.png；是否解决以新冻结PNG与独立评审为准，root未造新分。

## 材料分面要说明真实转向

round02七角色六组、round03三角色九组的共同正式异议，是长发、布、翼膜、尾鳞、金属重复同宽大亮带，不能靠多加glitter修复。发丝应随发束粗细/卷向形成不等长小簇，缎面亮暗来自腰部受力和翻折，金属是短而相对的深亮边，翼膜跟翼骨拉伸，尾鳞分片叠压。不能用等距条纹、均匀噪点或重复白点假装原生细节。

## 接口与持物也是绘制的一部分

AI裙搭native腿，生成的隐藏区域补片与接触影都归AI bottom，原生100仅覆盖真实原件。完整证据必须记录实际补片hash，独立评分不能忽略硬裙根/假黑圈。标准pose的手不能靠无限延指或移动原生手包强接；真实兼容姿态也应由作者绘制、普通衣橱与验收共用、标AI-owned并按98评，不能回用旧站姿或启用空模板后自称通过。
