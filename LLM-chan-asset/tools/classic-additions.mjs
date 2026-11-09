// These designs use the normal-proportion ZipZipPipe references, adapted to
// the same default-standing-v1 canvas as the first four characters.
export const additions = [
  {
    id: 'qwen', name: '千问', title: '青岚问扇',
    description: '蓝紫长辫、盘扣白衫与云锦长裙，把万千灵感藏进折扇。',
    color: '#6e7cbc', accent: '#e9ecff',
    standardReference: 'qwen/normal-zipzippipe-pixiv-148186519-p12.jpg',
    names: {
      background: '江南云锦书斋', aura: '云纹金环', back: '金边长袍后摆', hair: '青蓝长卷辫',
      legs: '云纹蓝金低跟鞋', bottom: '云锦层叠长裙', top: '盘扣白衫金边披袖',
      face: '紫瞳端庄浅笑', headwear: '斜帽云结蓝流苏', prop: '折扇与云纹手袋', effect: '云锦碎金',
    },
  },
  {
    id: 'gemini', name: 'Gemini', title: '星虹猫语',
    description: '蓝紫粉渐变长发与异色星瞳，猫尾摇出一片双子星光。',
    color: '#9873ca', accent: '#efe5ff',
    standardReference: 'gemini/normal-zipzippipe-pixiv-148186519-p04.jpg',
    names: {
      background: '双子星观测台', aura: '双子星轨', back: '星虹绒绒猫尾', hair: '星虹渐变长卷发',
      legs: '白堆袜星蓝厚底鞋', bottom: '星链燕尾不对称短裙', top: '星纹露肩垂袖短衣',
      face: '玫金灵动猫笑', headwear: '星芒猫耳发饰', prop: '虹彩双子浮星', effect: '星虹碎光',
    },
  },
  {
    id: 'glm', name: 'GLM', title: '墨铃梦狐',
    description: '墨蓝长发、银铃与白尖狐尾，守着一本安静的梦境之书。',
    color: '#59657e', accent: '#e9edf4',
    standardReference: 'glm/normal-zipzippipe-pixiv-148186519-p06.jpg',
    names: {
      background: '月夜午睡书房', aura: '银月梦环', back: '白尖墨狐尾', hair: '墨蓝长直发',
      legs: '黑白系带短靴', bottom: '墨雪层叠长围裙', top: '银扣蓬袖领结衫',
      face: '灰紫困倦闭口', headwear: '睡眠眼罩铃铛狐耳', prop: 'Z 纹黑银书', effect: '银蓝微光',
    },
  },
];

const palettes = {
  qwen: { dark: '#303354', mid: '#7889c8', light: '#d7def6', metal: '#c7a780' },
  gemini: { dark: '#353057', mid: '#9678db', light: '#ecb6f4', metal: '#dec3a0' },
  glm: { dark: '#222530', mid: '#4a5a75', light: '#e6e5ee', metal: '#aeb7c9' },
};
const line = (d, c, w = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const star = (x, y, r, fill, stroke = '#cbb398') => `<path d="M${x} ${y-r}Q${x+1} ${y-1} ${x+r} ${y}Q${x+1} ${y+1} ${x} ${y+r}Q${x-1} ${y+1} ${x-r} ${y}Q${x-1} ${y-1} ${x} ${y-r}Z" fill="${fill}" stroke="${stroke}" stroke-width=".7"/>`;
const rainbow = '<defs><linearGradient id="rainbow-star" x2="1" y2="1"><stop stop-color="#fff2c8"/><stop offset=".25" stop-color="#83dcf5"/><stop offset=".5" stop-color="#8e99f0"/><stop offset=".75" stop-color="#c584e9"/><stop offset="1" stop-color="#f5b5e9"/></linearGradient></defs>';

function back(id) {
  if (id === 'qwen') return `<defs><linearGradient id="robe"><stop stop-color="#30334f"/><stop offset=".3" stop-color="#515d96"/><stop offset=".5" stop-color="#363f6d"/><stop offset=".8" stop-color="#6674ac"/><stop offset="1" stop-color="#303350"/></linearGradient></defs>
    <path d="M52 97L60 106L54 143L45 169L37 197L27 190L38 150L43 122ZM87 97L80 108L88 143L97 170L106 198L116 190L104 151L98 122Z" fill="url(#robe)" stroke="#34344f"/>
    ${line('M51 102L46 135L39 163L30 189L37 193M89 103L96 136L102 165L113 190L106 194', '#c4a47c')}
    ${line('M49 130L44 157L34 187M91 130L98 158L109 188', '#91a1d1', .7)}
    <g fill="none" stroke="#bd9c76" stroke-width=".7"><path d="M33 179l3-2 3 2-2 3-3-1m2-5 3-3 3 1m63 5-3-2-3 2 2 3 3-1m-2-5-3-3-3 1"/><path d="M31 185l6 4 2-5m72 1-6 4-2-5"/></g>`;
  if (id === 'gemini') return `<defs><linearGradient id="cat-tail" x2=".4" y2="1"><stop stop-color="#627cce"/><stop offset=".48" stop-color="#7b8ede"/><stop offset=".75" stop-color="#a282e2"/><stop offset="1" stop-color="#e1a0e9"/></linearGradient></defs>
    <path d="M56 146Q39 160 31 179Q23 197 34 202Q42 206 46 198L44 193Q40 199 36 193Q33 186 40 176L44 174L41 174L48 169L46 170L54 165L52 164L62 156Z" fill="url(#cat-tail)" stroke="#41466f"/>
    ${line('M54 151Q39 165 33 180Q28 193 35 198Q41 201 43 196', '#b8b9f3', 1.5)}
    ${line('M35 181l2-4m-5 11 2-4m0 11 3 2', '#e9b4f1', .8)}`;
  return `<defs><linearGradient id="fox-tail" x2=".7" y2="1"><stop stop-color="#171b27"/><stop offset=".35" stop-color="#35435a"/><stop offset=".68" stop-color="#292b38"/><stop offset="1" stop-color="#62647a"/></linearGradient></defs>
    <path d="M89 140Q110 140 124 159L128 157L127 164L133 170L131 172L137 182L133 181L136 188L132 187L134 194L128 192L124 201L120 199L116 206L112 201L105 205L105 201L96 200L99 196Q113 188 109 179Q104 169 87 163Z" fill="url(#fox-tail)" stroke="#292b3a"/>
    <path d="M132 179L130 188L126 185L125 192L120 189L119 196L115 192L110 199L107 198L98 201L105 203L108 203L111 201L116 206L120 199L124 201L128 192L134 194L132 187L136 188L133 181Z" fill="#e4e1ec"/>
    ${line('M95 150Q118 157 125 175M95 155Q114 164 117 177M108 153L116 162M113 184L111 191M125 186L121 195M129 188L126 196', '#66718a', .7)}
    ${line('M111 199L116 194L118 199L122 193', '#fff9ff', 1)}`;
}

function props(id) {
  if (id === 'qwen') {
    const ribs = [[13,106],[17,101],[22,98],[27,98],[32,100],[37,105],[40,110]];
    return `<defs><linearGradient id="fan-blue" x2="1" y2=".8"><stop stop-color="#454b7a"/><stop offset=".4" stop-color="#9da9db"/><stop offset=".65" stop-color="#e9e5f5"/><stop offset="1" stop-color="#697fb9"/></linearGradient><linearGradient id="purse-white" x2="1" y2="1"><stop stop-color="#fffbff"/><stop offset=".55" stop-color="#eeedf6"/><stop offset="1" stop-color="#a5b5da"/></linearGradient></defs>
      <path d="M28 128L12 106Q18 97 26 98Q36 98 41 110L28 128Z" fill="url(#fan-blue)" stroke="#595572"/>
      ${ribs.map(([x,y]) => line(`M28 128L${x} ${y}`, '#c4aa8e', .6)).join('')}
      ${line('M14 106Q25 92 40 109', '#e5d1b5', .7)}
      ${line('M16 108q2-3 4-1m8-4q2-2 4 0m-2 9q2-2 4 0', '#ede5f0', .6)}
      <path d="M20 104l1-2 1 2 2 1-2 1-1 2-1-2-2-1ZM34 109l1-2 1 2 2 1-2 1-1 2-1-2-2-1Z" fill="#f4edf4"/>
      ${line('M28 126L31 136L30 145', '#c0a07c')}
      <path d="M29 144h3l1 9h-5Z" fill="#718bc5" stroke="#414f7e" stroke-width=".6"/>
      ${line('M30 146v6', '#c8d8ef', .6)}
      ${line('M108 130Q118 128 121 141M109 131Q111 135 110 141', '#c9ad87')}
      <path d="M111 140Q115 137 121 140L126 150Q126 157 121 159H109Q105 157 107 150Z" fill="url(#purse-white)" stroke="#867795"/>
      ${line('M110 141L109 153L110 157H122L124 153L121 141', '#c7a787', .7)}
      <path d="M112 146l4-3 4 3-1 5-3 2-4-3Z" fill="#727bb9" stroke="#c4a583" stroke-width=".6"/>
      <path d="M116 144l1 2 2 1-2 1-1 3-1-3-2-1 2-1Z" fill="#fff9fa"/>
      ${line('M109 144l1-2m13 4-1-3M111 155h3', '#fffdf7', .6)}
      <path d="M115 156l-4-2v4l4-1 4 2 1-4Z" fill="#5e71ad" stroke="#c4a583" stroke-width=".5"/>
      ${line('M116 158L117 166', '#c4a583', .8)}<path d="M115 164h3l1 9h-4Z" fill="#809bce" stroke="#4a5b8a" stroke-width=".5"/>`;
  }
  if (id === 'gemini') return `${rainbow}${star(120,112,10,'url(#rainbow-star)','#65547d')}${star(20,96,7,'url(#rainbow-star)','#65547d')}
    ${line('M120 103v18M111 112h18', '#f4e5ff', .55)}${line('M20 90v12M14 96h12', '#e4edff', .5)}
    <path d="M119 110h2v2h-2ZM19 95h1v1h-1Z" fill="#fff9f7"/>
    ${star(130,132,3,'#edb0ed')}${star(15,116,2,'#9bcefa')}`;
  return `<defs><linearGradient id="book-black" x2="1" y2=".5"><stop stop-color="#4a4d5c"/><stop offset=".35" stop-color="#292c36"/><stop offset="1" stop-color="#151924"/></linearGradient></defs>
    <path d="M109 115L128 111L134 142L115 146Z" fill="#c9cbd4" stroke="#292b38"/>
    <path d="M108 114L126 111L132 141L114 144Z" fill="url(#book-black)" stroke="#1e2330"/>
    ${line('M111 116L124 114L129 139L116 141Z', '#b6bbca', .6)}
    ${line('M113 117L114 119M124 115L123 117M116 138L118 138M128 137L126 136', '#e0e2e9', .6)}
    <path d="M116 122L124 121L125 129L117 130Z" fill="#303440" stroke="#a8afc0" stroke-width=".6"/>
    <path d="M118 123L123 122L123 124L120 127L124 126L124 128L118 129L118 127L121 124L118 125Z" fill="#f5f3f7"/>
    ${line('M130 116L134 139M131 120L134 138', '#f1eef4', .6)}
    ${line('M113 116L122 114M116 142L127 140', '#d1d8e6', .5)}
    <path d="M120 143l1 9 2-3 2 2-2-9Z" fill="#447ca4" stroke="#c7cbd8" stroke-width=".5"/>`;
}

function aura(id, p) {
  if (id === 'qwen') return `<g fill="none" stroke="${p.metal}" stroke-width=".7" opacity=".75"><path d="M33 96A38 38 0 0 1 107 96" stroke-dasharray="2 3"/><path d="M25 93q-5-4-8 0-4 0-4 4h16m81-9q5-4 8 0 4 0 4 4h-16"/></g>`;
  if (id === 'gemini') return `${rainbow}<ellipse cx="70" cy="96" rx="49" ry="25" transform="rotate(-22 70 96)" fill="none" stroke="#aaa0df" stroke-width=".7" stroke-dasharray="2 4"/>${star(28,114,3,'url(#rainbow-star)')}${star(111,77,4,'url(#rainbow-star)')}`;
  return `<path d="M43 97A30 30 0 0 1 96 81" fill="none" stroke="${p.metal}" stroke-width=".7" stroke-dasharray="1 4"/><path d="M107 49Q100 54 104 59Q97 58 97 52Q99 46 107 49Z" fill="#c9d4e8" stroke="#8496b4" stroke-width=".5"/>`;
}

export async function buildAdditions(options) {
  const { saveSvg, svgDocument } = options;
  for (const c of additions) {
    const p = palettes[c.id];
    for (const [name, body] of [['back',back(c.id)],['prop',props(c.id)],['aura',aura(c.id,p)]]) {
      await saveSvg(c.id, name, svgDocument(body, `${c.name} ${c.names[name]} · default-standing-v1`), true);
    }
    const points = [[18,37],[121,62],[17,155],[122,180],[31,210],[109,216]];
    const effect = (c.id === 'gemini' ? rainbow : '') + points.map(([x,y],n) => star(x,y,n%2?2:3,c.id==='gemini'?'url(#rainbow-star)':n%2?p.metal:p.light,p.mid)).join('');
    await saveSvg(c.id, 'effect', svgDocument(effect, `${c.name} ${c.names.effect}`), true);
  }
}
