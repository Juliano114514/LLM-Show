// Local environmental overlays on the original 140×226 scene coordinates.
// Every trajectory is periodic. The compositor places these behind the person.
const TAU = Math.PI * 2;
const wave = (phase, offset = 0) => Math.sin(TAU * (phase + offset));
const shift = (phase, distance, offset = 0) => Math.round(distance * wave(phase, offset));
const rect = (x, y, w, h, colour, opacity = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${colour}" opacity="${opacity.toFixed(3)}"/>`;
const line = (d, colour, opacity = 1) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="1" opacity="${opacity.toFixed(3)}"/>`;
function glint(x, y, colour, opacity, arms = 1) {
  return rect(x, y, 1, 1, colour, opacity) + rect(x - arms, y, arms * 2 + 1, 1, colour, opacity * .65) + rect(x, y - arms, 1, arms * 2 + 1, colour, opacity * .65);
}
function gpt(phase) {
  const dx = shift(phase, 2), dy = shift(phase, 1, .25);
  const orbitX = Math.round(35 + 15 * Math.cos(TAU * phase));
  const orbitY = Math.round(24 + 5 * Math.sin(TAU * phase));
  // A tiny travelling star follows the upper-left astrolabe's ellipse.
  let markup = glint(orbitX, orbitY, '#fff5da', .85);
  markup += rect(orbitX - 1, orbitY + 1, 1, 1, '#e6d8fb', .5);
  // Sparse wisps drift in the sky opening; the architectural frame stays still.
  markup += `<g transform="translate(${dx} ${dy})">${line('M77 41h5v-1h8v1h6', '#ebe4f9', .32)}${line('M82 43h9', '#d8cdef', .26)}</g>`;
  markup += `<g transform="translate(${-dx} ${-dy})">${line('M24 151h6v-1h7v1h7', '#f4eefc', .35)}${line('M28 153h13', '#d9cbee', .28)}</g>`;
  for (const [x, y, offset] of [[69, 12, 0], [96, 28, .35], [21, 44, .6]]) {
    markup += glint(x + shift(phase, 1, offset), y, '#fff8ff', .28 + .5 * (1 + wave(phase, offset)) / 2);
  }
  return markup;
}
function qwen(phase) {
  const dx = shift(phase, 1), dy = shift(phase, 1, .25);
  // The bamboo shadows sit in the pale wall above/right of the character.
  let markup = `<g transform="translate(${dx} ${dy})" fill="#78949a" opacity=".25"><path d="M85 31l5-5-2 5ZM90 35l7-4-4 5ZM95 42l6-4-3 5ZM89 44l-4-4 1 5Z"/>${line('M86 26l7 17', '#8caaad', .45)}</g>`;
  // A few blossom petals lift in a small breeze beside the left garden window.
  for (const [x, y, offset] of [[13, 68, 0], [23, 103, .35], [18, 154, .7]]) {
    const px = x + shift(phase, 2, offset), py = y + shift(phase, 3, offset + .2);
    const opacity = .32 + .4 * (1 + wave(phase, offset + .1)) / 2;
    markup += `<path d="M${px} ${py}h2v1h-1v1h-1Z" fill="#e8d8f3" opacity="${opacity.toFixed(3)}"/>`;
    markup += rect(px, py, 1, 1, '#faf2ff', opacity * .8);
  }
  // The lower gold thread adds a one-pixel swing below the existing lantern.
  const tipX = 111 + shift(phase, 1, .1);
  markup += line(`M111 47L${tipX} 52v3`, '#d4b178', .55);
  markup += rect(tipX - 1, 55, 2, 2, '#e9c583', .55);
  return markup;
}
function gemini(phase) {
  const angle = TAU * phase;
  // A small gold companion travels around the fixed blue/orange twin stars.
  const x = Math.round(76 + 15 * Math.cos(angle)), y = Math.round(20 + 6 * Math.sin(angle));
  let markup = glint(x, y, '#ffe8b6', .8);
  markup += rect(x - 1, y + 1, 1, 1, '#a9e6fc', .5);
  // The left hanging star globe has a second narrow orbital highlight.
  const orbX = Math.round(8 + 6 * Math.cos(angle + 1.2));
  const orbY = Math.round(87 + 3 * Math.sin(angle + 1.2));
  markup += rect(orbX, orbY, 1, 2, '#dfc4fc', .7);
  // Slow short meteor strokes occupy the right sky, clear of the telescope.
  for (const [mx, my, offset] of [[116, 54, 0], [104, 72, .45]]) {
    const dx = shift(phase, 2, offset), dy = -shift(phase, 2, offset);
    const brightness = .15 + .55 * (1 + wave(phase, offset + .25)) / 2;
    markup += `<g transform="translate(${dx} ${dy})">${line(`M${mx - 4} ${my + 4}l4-4`, '#9fdef6', brightness * .45)}${glint(mx, my, '#e8fcff', brightness)}</g>`;
  }
  const sweep = shift(phase, 2, .25);
  markup += line(`M115 96L${107 + sweep} 83`, '#b1e9ff', .16 + .12 * (1 + wave(phase)) / 2);
  return markup;
}

export const CELESTIAL_MOTION_NOTES = {
  gpt: '上方星图小星沿椭圆缓慢环行，天空与侧边云丝作 1–2px 周期漂动，稀疏星芒轻闪。',
  qwen: '右上窗竹投影轻摇，左侧园景花瓣作 2–3px 微风浮动，灯笼下穗作 1px 轻摆。',
  gemini: '双子星上方小星与左侧星仪亮点沿轨道移动，右侧短流星及观测微光缓慢掠动。',
};

export function celestialMotion(id, phase) {
  const render = { gpt, qwen, gemini }[id];
  return render ? render(phase) : '';
}
