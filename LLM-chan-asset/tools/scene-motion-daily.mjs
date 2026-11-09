// Local environmental motion for the four domestic/night scenes. All positions
// use the unchanged 140x226 background canvas; the exporter keeps people above
// this layer. No bitmap is translated and no camera motion is introduced.
const TAU = Math.PI * 2;
const wrap = value => ((value % 1) + 1) % 1;
const alpha = value => Math.max(0, Math.min(1, value)).toFixed(3);
const offset = (phase, amplitude = 2) => Math.round(Math.sin(phase * TAU) * amplitude);
const dot = (x, y, colour, opacity = 1) => `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="1" height="1" fill="${colour}" opacity="${alpha(opacity)}"/>`;

// Each wisp dissolves before it returns to its source, so the wrapped rise does
// not show a sudden reset. Two staggered wisps keep the kettle quietly active.
function steam(x, bottom, phase, colour = '#fff8e6', height = 11) {
  const u = wrap(phase), y = bottom - Math.round(u * height);
  const dx = offset(u, 2), opacity = Math.sin(Math.PI * u) ** 2 * .58;
  return `<path d="M${x + dx} ${y}v-2h-1v-2h1v-2h1v-2" fill="none" stroke="${colour}" stroke-width="1" opacity="${alpha(opacity)}"/>`;
}

function dust(x, y, phase, colour, opacity = .65) {
  const u = wrap(phase);
  return dot(x + offset(u, 1), y + offset(u + .25, 2), colour, (.35 + .65 * Math.sin(Math.PI * u) ** 2) * opacity);
}

function deepseek(phase) {
  const ocean = [
    [9, 57, 7, .0], [25, 61, 9, .3], [14, 68, 6, .6],
  ].map(([x, y, width, shift]) => {
    const p = wrap(phase + shift), dx = offset(p, 2);
    return `<path d="M${x + dx} ${y}h${width}" stroke="#d1f9ff" stroke-width="1" opacity="${alpha(.25 + .3 * Math.sin(p * TAU) ** 2)}"/>`;
  }).join('');
  // These wisps originate at the background rice cooker, not the hand-held bowl.
  return `<g data-scene-motion="rice-steam-and-sea">${steam(125, 116, phase, '#fffdf2', 12)}${steam(130, 116, phase + .47, '#f9faff', 13)}${ocean}</g>`;
}

function claude(phase) {
  const motes = [
    [111, 51, .1], [120, 90, .45], [105, 117, .7], [109, 174, .25],
  ].map(([x, y, shift]) => dust(x, y, phase + shift, '#fff1c9', .45)).join('');
  // The porcelain cup sits at x115/y139 on the lace-covered side table.
  // A teapot wisp remains visible beyond the character's hand-held book.
  const tea = steam(115, 137, phase + .12, '#fff4db', 8) + steam(118, 137, phase + .66, '#fff8e8', 9)
    + `<g opacity=".8">${steam(134, 133, phase + .38, '#fff8e8', 9)}</g>`;
  const dx = offset(phase, 1);
  const windowGlint = `<path d="M${127 + dx} 71l-3 6m-7 19-2 4m-3 9-2 3" fill="none" stroke="#fff2cc" stroke-width="1" opacity="${alpha(.13 + .13 * Math.sin(phase * TAU) ** 2)}"/>`;
  return `<g data-scene-motion="tea-and-window-dust">${tea}${motes}${windowGlint}</g>`;
}

function petal(x, top, phase, colour) {
  const u = wrap(phase), dx = offset(u, 2), y = top + Math.round(u * 16);
  const opacity = Math.sin(Math.PI * u) ** 2 * .7;
  return `<path d="M${x + dx} ${y}h2v1h-1v1h-2v-1h1Z" fill="${colour}" opacity="${alpha(opacity)}"/>`;
}

function grok(phase) {
  const lean = offset(phase, 1), tip = offset(phase + .2, 1);
  // The flame remains inside the right-hand lantern's glass housing.
  const flame = `<path d="M133 74v-4l${lean} -2 1 -3 1 ${3 + tip} 1 2v4Z" fill="#ffe3a5" opacity="${alpha(.52 + .16 * Math.sin(phase * TAU) ** 2)}"/><path d="M134 73v-3" stroke="#fff5ce" opacity=".65"/>`;
  const rose = petal(10, 146, phase, '#bd648b') + petal(17, 172, phase + .53, '#e294ad');
  const smallStars = [[54, 33, .1], [83, 44, .35], [92, 60, .7]].map(([x, y, shift]) => dust(x, y, phase + shift, '#ffe0b8', .62)).join('');
  return `<g data-scene-motion="lantern-flame-and-rose">${flame}${rose}${smallStars}</g>`;
}

function glm(phase) {
  const dx = offset(phase, 2), dy = offset(phase + .25, 1);
  // Thin stepped cloud edges sit entirely within the left-hand night window.
  const cloud = `<g transform="translate(${dx} ${dy})" fill="#bac7f4" opacity=".25"><path d="M8 65h4v-1h4v-2h4v1h4v1h3v1h4v1H8Z"/><path d="M18 80h4v-1h5v-1h3v1h4v1h3v1H18Z"/></g>`;
  const moonDust = [[13, 45, .1], [33, 76, .6], [121, 153, .25], [126, 168, .75]].map(([x, y, shift]) => dust(x, y, phase + shift, '#e6e6ff', .55)).join('');
  return `<g data-scene-motion="moon-window-clouds">${cloud}${moonDust}</g>`;
}

export const DAILY_MOTION_NOTES = {
  deepseek: '右侧背景电饭锅的热气轻轻上升、消散，海景圆窗里的小段波光横移。',
  claude: '右侧茶具升起细茶气，窗边暖色微尘和小片日光缓缓漂动。',
  grok: '右侧露台灯焰微微摇动，左边缘两片玫瑰花瓣交错飘落，远星低幅闪动。',
  glm: '左侧月窗内薄云轻移，书边几粒月尘安静漂浮，不改变困倦闭口表情。',
};

export function dailyMotion(id, phase) {
  const renderers = { deepseek, claude, grok, glm };
  return Object.hasOwn(renderers, id) ? renderers[id](wrap(phase)) : '';
}
