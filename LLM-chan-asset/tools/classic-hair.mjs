import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { GPT_COLORS, gptTone } from './classic-theme.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localRequire = createRequire(path.join(projectRoot, 'tools/.deps/package.json'));

const palettes = {
  gpt: { hue: 255, saturation: .20, low: .18, high: .99, gamma: .77 },
  deepseek: { hue: 221, saturation: .56, low: .065, high: .94, gamma: 1.25 },
  claude: { hue: 25, saturation: .81, low: .085, high: .97, gamma: .89 },
  grok: { hue: 38, saturation: .66, low: .13, high: .97, gamma: .85 },
};

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const k = h / 60;
  const x = c * (1 - Math.abs(k % 2 - 1));
  const [r, g, b] = k < 1 ? [c,x,0] : k < 2 ? [x,c,0] : k < 3 ? [0,c,x] : k < 4 ? [0,x,c] : k < 5 ? [x,0,c] : [c,0,x];
  const m = l - c / 2;
  return [r,g,b].map(v => Math.round((v + m) * 255));
}

function recolor(r, g, b, x, y, character) {
  const p = palettes[character];
  const hi = Math.max(r,g,b), lo = Math.min(r,g,b);
  const chroma = hi - lo;
  // Green ties in the original ponytail become the character's dark ribbons.
  if (g > r * 1.06 && g > b * 1.06 && chroma > 25) {
    return character === 'grok' ? [41,32,44] : character === 'deepseek' ? [73,123,180] : [185,179,203];
  }
  const luminance = (.2126 * r + .7152 * g + .0722 * b) / 255;
  const tone=luminance;
  let lightness = p.low + (p.high - p.low) * Math.pow(tone, p.gamma);
  if(character==='gpt') return gptTone(luminance<.05 ? luminance*2 : .30+.70*Math.pow(Math.max(0,(luminance-.05)/.95),.55));
  let saturation = p.saturation * (.80 + .20 * (1 - lightness));
  let hue = p.hue;
  if (character === 'deepseek') {
    const lower = Math.max(0, Math.min(1, (y - 78) / 46));
    hue -= lower * 13;
    lightness = Math.min(.98, lightness + lower * .11);
    saturation = Math.min(.70, saturation + lower * .04);
  }
  if (character === 'gpt') saturation *= .78 + .22 * (1 - lightness);
  return hslToRgb(hue, saturation, lightness);
}

const xmlEscape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

// Pure editable SVG geometry: each color contains horizontal runs of native pixels.
// No embedded raster, resampling, image filter, crop, or canvas-coordinate change.
async function traceHair(sharp, filename, character, label, maxY=226, minY=0) {
  const { data, info } = await sharp(filename, { page: 0, pages: 1 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 140 || info.height !== 226) throw new Error(`Unexpected hair canvas: ${filename}`);
  const groups = new Map();
  const bounds = { left:140, top:226, right:0, bottom:0 };
  for (let y=Math.max(0,minY);y<Math.min(226,maxY);y++) {
    let x=0;
    while (x<140) {
      const n=(y*140+x)*4;
      if (!data[n+3]) {x++;continue;}
      const rgb=recolor(data[n],data[n+1],data[n+2],x,y,character);
      const fill='#'+rgb.map(c=>c.toString(16).padStart(2,'0')).join('');
      const alpha=data[n+3];
      let right=x+1;
      while (right<140) {
        const next=(y*140+right)*4;
        if (data[next+3]!==alpha) break;
        const mapped=recolor(data[next],data[next+1],data[next+2],right,y,character);
        if (mapped.some((c,i)=>c!==rgb[i])) break;
        right++;
      }
      const key=fill+':'+alpha;
      if (!groups.has(key)) groups.set(key,{fill,alpha,parts:[]});
      groups.get(key).parts.push(`M${x} ${y}h${right-x}v1H${x}z`);
      bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,right);
      bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y+1);
      x=right;
    }
  }
  const paths=[...groups.values()].map((g,i)=>`<path fill="var(--hair-${String(i).padStart(3,'0')},${g.fill})"${g.alpha===255?'':` opacity="${(g.alpha/255).toFixed(4)}"`} d="${g.parts.join('')}"/>`).join('\n');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="226" viewBox="0 0 140 226" shape-rendering="crispEdges"><title>${xmlEscape(label)}</title><desc>Native 140×226 QQ Show standing coordinates. Pixel-run vector tracing of ${xmlEscape(path.basename(filename))}; recolored without resizing. CSS --hair-NNN variables edit the palette.</desc>\n${paths}\n</svg>`;
  return {svg,bounds:{left:bounds.left,top:bounds.top,width:bounds.right-bounds.left,height:bounds.bottom-bounds.top},colors:groups.size};
}

const svg = (label,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="226" viewBox="0 0 140 226" shape-rendering="crispEdges"><title>${label}</title>${body}</svg>`;

const HAIR_COLORS={
  gpt:{outline:GPT_COLORS.contour,deep:GPT_COLORS.deep,shadow:GPT_COLORS.shadow,base:GPT_COLORS.mid,light:GPT_COLORS.pearl,highlight:GPT_COLORS.highlight},
  deepseek:{outline:'#1D2D55',deep:'#27365F',shadow:'#364B7D',base:'#4B66A0',light:'#79A5D0',highlight:'#B6DDF2'},
  claude:{outline:'#763A27',deep:'#8F4427',shadow:'#BE6232',base:'#E38A46',light:'#F7B46E',highlight:'#FFE0A0'},
  grok:{outline:'#835336',deep:'#A5683E',shadow:'#C78C52',base:'#EFC383',light:'#FFDEAA',highlight:'#FFF2D3'},
};

const svgBody=value=>value.slice(value.indexOf('>')+1,value.lastIndexOf('</svg>')).replace(/<title>[\s\S]*?<\/title>/g,'').replace(/<desc>[\s\S]*?<\/desc>/g,'');
const fillPath=(fill,d,extra='')=>`<path fill="${fill}" d="${d}"${extra}/>`;

function looseBack(character) {
  const p=HAIR_COLORS[character];
  const edge=character==='gpt'?1:.65;
  if(character==='grok') return twinBack(p);
  const straight=character==='claude';
  let body=`<g id="standard-long-loose-hair" data-pose="default-standing-v1">`;
  body+=fillPath(p.base,'M52 54Q69 43 87 54L94 93Q97 116 91 141L83 152Q75 151 70 143Q64 151 55 153L46 139Q42 117 46 95Z',` stroke="${p.outline}" stroke-width="${edge}"`);
  // Each tapered lock has a native-pixel contour, narrow shadow, and an offset
  // white/blue/orange highlight. The roots remain under the original small scalp.
  const locks=straight ? [
    ['M53 60C46 80 48 100 42 117C38 130 43 141 38 150C47 151 51 141 49 132C47 123 53 111 55 99L59 63Z','M53 67C49 84 52 98 46 116C42 128 46 137 43 145','M51 82C50 97 50 106 46 118'],
    ['M59 66C53 85 57 108 51 123C47 135 51 144 48 152C57 149 58 139 56 131C55 124 61 110 63 96L64 66Z','M60 75C55 91 60 107 54 123C51 134 55 140 52 147','M58 92C58 103 58 111 54 121'],
    ['M66 73C59 94 65 114 59 130C56 139 58 147 55 154C64 153 66 144 64 136C62 126 69 111 70 96L71 74Z','M66 84C62 99 67 115 62 130C59 140 62 147 59 151','M65 104L65 115Q65 125 62 132'],
  ] : [
    ['M53 59C45 72 50 85 44 96C37 106 42 113 43 119C45 128 40 133 36 136C44 140 50 133 49 125C49 116 45 111 50 103C57 93 54 79 59 65Z','M53 66C48 77 52 86 47 96C41 106 46 114 46 121C48 129 43 134 40 135','M50 78Q52 87 47 97Q43 103 44 108'],
    ['M59 65C53 83 57 96 51 109C47 118 52 125 51 132C50 140 45 144 44 149C52 151 57 141 57 134C57 125 53 120 57 112C64 101 60 86 65 70Z','M59 72C55 86 61 96 54 110C50 120 56 125 54 134C53 142 49 147 48 148','M57 84Q60 98 54 111Q52 116 53 119'],
    ['M66 70C60 87 67 104 61 116C56 127 62 134 61 140L58 153C66 153 69 144 67 137C64 126 69 122 71 112L72 74Z','M66 81C62 95 69 105 64 116C59 128 65 134 64 141L62 149','M66 95Q68 106 64 116Q61 123 63 130'],
  ];
  for(const [index,[outline,line,shine]] of locks.entries()) {
    body+=`<g id="left-fall-${index+1}">`;
    body+=fillPath(index===2?p.shadow:p.base,outline,` stroke="${p.outline}" stroke-width="${edge}"`);
    body+=`<path fill="none" stroke="${p.light}" stroke-width="${index===0?2.3:1.8}" d="${line}"/>`;
    body+=`<path fill="none" stroke="${p.highlight}" stroke-width=".75" d="${shine}"/>`;
    body+='</g>';
  }
  body+=`<g id="right-long-falls" transform="translate(140 0) scale(-1 1)">`;
  for(const [index,[outline,line,shine]] of locks.entries()) {
    body+=fillPath(index===1?p.light:p.base,outline,` stroke="${p.outline}" stroke-width="${edge}"`);
    body+=`<path fill="none" stroke="${p.shadow}" stroke-width="1.4" d="${line}"/>`;
    body+=`<path fill="none" stroke="${p.highlight}" stroke-width=".8" d="${shine}"/>`;
  }
  body+='</g>';
  // Loose fly-away tips match the long, unbound silhouettes in both reference sets.
  if(character==='deepseek') body+=`<g fill="none" stroke-width=".75"><path stroke="${p.outline}" d="M47 93Q34 99 38 108Q40 112 35 115M95 99Q107 106 102 115Q99 120 105 123M45 125Q34 132 39 141Q42 145 37 148"/><path stroke="${p.light}" d="M48 97Q39 103 42 110M95 105Q103 110 99 118M45 130Q38 136 42 142"/></g>`;
  if(character==='gpt') body+=`<g fill="none" stroke="${p.light}" stroke-width="1"><path d="M46 107Q35 113 39 122Q43 127 37 132M96 114Q107 121 101 128Q98 131 104 133"/></g>`;
  return body+'</g>';
}

function twinBack(p) {
  const single=`
${fillPath(p.base,'M52 52C43 51 40 60 42 71C45 83 39 91 39 102C39 114 46 119 42 129C39 137 32 139 35 146C42 151 49 144 49 135C48 128 54 124 53 115C51 105 47 103 50 92C54 80 49 69 57 59Z',` stroke="${p.outline}" stroke-width=".8"`)}
${fillPath(p.light,'M50 57C44 60 46 72 46 78C47 90 42 95 43 104C44 116 49 117 47 128C46 136 41 141 38 142C44 144 46 136 45 132C43 121 50 119 48 111C45 102 45 99 48 89C51 77 46 68 53 60Z')}
<path fill="none" stroke="${p.highlight}" stroke-width=".85" d="M48 62Q47 70 49 78Q49 86 46 94M44 101Q44 111 48 116M45 133Q45 141 39 144"/>
<path fill="none" stroke="${p.shadow}" stroke-width="1.3" d="M51 64Q48 76 51 84Q49 94 47 101Q46 107 50 114Q54 122 48 128"/>
${fillPath(p.light,'M44 113Q35 118 39 126Q44 133 38 136Q47 135 44 128Q39 123 43 119Z')}
<path fill="none" stroke="${p.outline}" stroke-width=".65" d="M42 115Q36 122 41 126Q46 134 38 137"/>`;
  return `<g id="long-twin-ponytails"><g id="left-long-ponytail">${single}</g><g id="right-long-ponytail" transform="translate(140 0) scale(-1 1)">${single}</g></g>`;
}

function frontLocks(character) {
  const p=HAIR_COLORS[character];
  const edge=character==='gpt'?1:.55;
  let b='<g id="standard-front-locks">';
  if(character==='gpt'||character==='deepseek') {
    // Three small overlapping bangs end above the default eye line (y≈68).
    b+=fillPath(p.base,'M62 47Q67 44 71 47Q70 56 76 65Q69 65 65 58Q64 62 60 65Q63 56 60 51Z',` stroke="${p.outline}" stroke-width="${edge}"`);
    b+=fillPath(p.light,'M64 48Q65 55 70 61L68 57L66 48Z');
    b+=fillPath(p.base,'M72 46Q79 46 82 51Q80 57 84 64Q77 61 76 54L75 60Q70 55 72 46Z',` stroke="${p.outline}" stroke-width="${edge}"`);
    b+=`<path fill="none" stroke="${p.highlight}" stroke-width=".7" d="M74 48Q73 52 77 57M64 49Q65 54 67 56"/>`;
    b+=fillPath(p.light,'M51 73Q49 86 55 94Q59 101 54 110Q60 108 59 101Q58 95 55 90L55 84L53 79Z',` stroke="${p.outline}" stroke-width="${edge}"`);
    b+=fillPath(p.base,'M86 73Q89 84 84 95Q81 103 85 110Q88 113 86 118Q94 113 88 106Q86 101 89 94Q92 83 89 76Z',` stroke="${p.outline}" stroke-width="${edge}"`);
    b+=`<path fill="none" stroke="${p.highlight}" stroke-width=".8" d="M53 84Q52 92 57 97Q59 102 56 107M88 83Q89 90 86 98Q84 103 88 109"/>`;
  }
  if(character==='deepseek') {
    b+=`<path id="single-whale-ahoge" fill="none" stroke="${p.outline}" stroke-width="1.6" d="M69 46C77 40 77 33 70 32C61 31 57 41 62 42"/><path fill="none" stroke="${p.light}" stroke-width=".65" d="M69 45C75 40 76 34 70 33C63 32 59 39 62 41"/>`;
  } else if(character==='gpt') {
    b+=`<path id="silver-ahoge" fill="none" stroke="${p.outline}" stroke-width="1.3" d="M69 46Q65 40 69 37Q73 35 76 38"/><path fill="none" stroke="${p.highlight}" stroke-width=".6" d="M70 45Q67 40 70 38Q73 36 75 38"/>`;
  } else if(character==='claude') {
    b+=fillPath(p.base,'M58 47Q65 43 69 48Q66 56 70 64Q63 64 61 58L57 66Q60 58 56 52Z',` stroke="${p.outline}" stroke-width=".5"`);
    b+=`<path fill="none" stroke="${p.highlight}" stroke-width=".8" d="M61 48Q60 53 64 59"/>`;
    b+=fillPath(p.base,'M47 88Q44 104 50 117Q54 126 48 136Q57 134 55 126Q54 117 52 112L53 95Z',` stroke="${p.outline}" stroke-width=".65"`);
    b+=fillPath(p.light,'M89 86Q86 100 91 114Q94 124 88 132Q96 133 96 124Q94 116 94 111L95 97Z',` stroke="${p.outline}" stroke-width=".65"`);
    b+=`<path fill="none" stroke="${p.highlight}" stroke-width=".8" d="M49 95Q47 106 53 119M92 95Q89 103 94 114"/>`;
  } else if(character==='grok') {
    b+=fillPath(p.base,'M63 45Q68 45 71 48Q70 56 76 64Q69 64 65 58L65 64Q60 61 61 54Z',` stroke="${p.outline}" stroke-width=".55"`);
    b+=fillPath(p.light,'M65 48Q64 54 70 59L68 54L67 48Z');
    b+=fillPath(p.base,'M53 75Q52 86 58 94Q61 101 57 106Q63 107 63 101Q61 92 58 88L57 79Z',` stroke="${p.outline}" stroke-width=".55"`);
    b+=fillPath(p.light,'M85 75Q88 86 82 94Q79 101 83 107Q77 107 77 101Q79 93 82 88L82 79Z',` stroke="${p.outline}" stroke-width=".55"`);
    b+=`<path fill="none" stroke="${p.highlight}" stroke-width=".8" d="M55 83Q54 89 59 96M84 83Q85 89 80 96"/>`;
  }
  return b+'</g>';
}

function longNativeTexture(character,texture) {
  // Re-use only native lower locks, never the scalp or its old accessories.
  // Copies translate by whole pixels, retaining the original 1px strands.
  const body=svgBody(texture.svg),key=character+'-long-texture';
  return `<defs><clipPath id="${key}"><path d="M51 58L89 58L100 88L108 122L103 153L36 155L32 135L40 104Z"/></clipPath><clipPath id="${key}-left"><path d="M29 76H61V159H29Z"/></clipPath><clipPath id="${key}-right"><path d="M79 76H111V159H79Z"/></clipPath></defs><g id="native-pixel-strand-extensions" clip-path="url(#${key})"><g transform="translate(0 5)">${body}</g><g clip-path="url(#${key}-left)"><g transform="translate(-5 29)">${body}</g></g><g clip-path="url(#${key}-right)"><g transform="translate(5 29)">${body}</g></g></g>`;
}

async function vectorBounds(sharp,value) {
  const {data,info}=await sharp(Buffer.from(value)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=140,top=226,right=0,bottom=0;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>8) {
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
  }
  return {left,top,width:right-left,height:bottom-top};
}

function headwear(character) {
  if (character==='gpt') return svg('GPT 月白龙角', `
<g id="ivory-dragon-horns">
 <path fill="${GPT_COLORS.pearl}" stroke="${GPT_COLORS.contour}" stroke-width=".8" d="M55 57Q49 54 50 49Q53 42 52 36Q58 41 58 46L60 53L58 57ZM81 56L81 49Q84 44 85 35Q90 40 87 47Q90 51 88 55L85 58Z"/>
 <path fill="${GPT_COLORS.shadow}" d="M51 49L55 51L54 55L58 56L59 53L56 46L54 40L54 48ZM83 49L85 50L84 54L87 56L88 53L85 47L87 40L85 43Z"/>
 <path fill="${GPT_COLORS.highlight}" d="M52 44h1v5h-1zM54 50h2v3h-2zM85 40h1v4h-1zM86 49h1v4h-1z"/>
 <path fill="none" stroke="${GPT_COLORS.metal}" stroke-width=".55" d="M51 47l5 1M51 51l6 1M54 42l3 1M83 47l5 1M82 52l6 1M85 42l3 1"/>
</g>
<g id="silver-knot-clip"><path fill="${GPT_COLORS.contour}" d="M84 56h4v1h2v2h1v4h-1v2h-2v1h-4v-1h-2v-2h-1v-4h1v-2h2z"/><g fill="none" stroke="${GPT_COLORS.pearl}" stroke-width="1.1"><path d="M84 58Q88 57 88 60L84 63Q81 61 84 58ZM89 59Q91 63 87 64L84 60Q85 57 89 59ZM88 65Q84 67 83 63L87 59Q90 60 88 65Z"/></g><path fill="${GPT_COLORS.metal}" d="M87 66h1v9h-1z"/><path fill="${GPT_COLORS.highlight}" d="M86 75h3v4h-3z"/><path fill="${GPT_COLORS.contour}" d="M86 78h1v2h-1zM88 78h1v2h-1z"/></g>`);
  if (character==='deepseek') return svg('DeepSeek 海盐蕾丝发箍', `
<g id="maid-headband"><path fill="#263a73" d="M48 54v-5h3v-4h5v-3h6v-2h14v1h7v3h5v4h3v6h-4v-4h-4v-3h-7v-2H63v1h-7v3h-4v5z"/>
<path fill="#dceafa" d="M49 53v-4h3v-4h5v-2h6v-2h12v1h7v3h5v4h3v4h-3v-4h-5v-3h-7v-1H63v1h-7v3h-4v4z"/>
<path fill="#fffdf5" d="M51 46h2v5h-2zM57 43h2v5h-2zM64 41h2v5h-2zM72 41h2v5h-2zM80 43h2v5h-2zM86 47h2v5h-2z"/>
<path fill="#6da5d2" d="M88 55h-4v6h4l2-2 2 2h4v-6h-4l-2 2z"/><path fill="#263a73" d="M89 57h2v3h-2z"/></g>
<g id="fin-ear-clips"><path fill="#28375E" stroke="#1D2D55" stroke-width=".6" d="M51 68Q46 72 38 75L42 78L48 77L52 74ZM89 68Q94 72 102 75L98 78L92 77L88 74Z"/><path fill="#D3E5F5" d="M40 75L44 75L48 73L51 72L49 76L46 77L45 76L42 77ZM100 75L96 75L92 73L89 72L91 76L94 77L95 76L98 77Z"/><path fill="none" stroke="#6985B4" stroke-width=".65" d="M42 74L47 74M93 74L98 74"/></g>`);
  if (character==='claude') return svg('Claude 橘花黑缎发饰', `
<g id="black-ribbon"><path fill="#4c3031" d="M85 53l-5 1v6l5 2 3-3 3 3 5-2v-6l-5-1-3 3z"/><path fill="#735049" d="M82 55h3l2 2-3 1h-2zM90 55h4v3h-3l-2-1z"/><path fill="#34262c" d="M85 60h3v11l-3-2-2 2zM90 60h3l2 10-3-1-2 2z"/></g>
<g id="orange-daisy"><path fill="#8c482b" d="M86 48h3v3h2v-1h3v3h-2v2h3v3h-4v2h-3v-3h-2v2h-3v-3h2v-2h-3v-3h4z"/><path fill="#ee9c38" d="M87 49h1v4h-1zM90 52h3v1h-3zM90 56h3v1h-3zM88 57h1v2h-1zM84 55h3v1h-3zM84 52h2v1h-2z"/><path fill="#ffe29b" d="M87 53h3v3h-3z"/><path fill="#b87931" d="M88 54h2v2h-2z"/></g>`);
  return svg('Grok 黑蝴蝶结小王冠', `
<g id="gothic-bows"><path fill="#241D29" stroke="#4D3A43" stroke-width=".55" d="M49 49L43 43L41 44L42 55L49 54L52 57L57 52L57 45L55 44L51 49ZM91 49L97 43L99 44L98 55L91 54L88 57L83 52L83 45L85 44L89 49Z"/><path fill="#53414C" d="M43 46L48 50L44 52ZM53 48L55 46L55 51L52 53ZM97 46L92 50L96 52ZM87 48L85 46L85 51L88 53Z"/><path fill="#C29A5D" d="M49 50h3v3h-3zM88 50h3v3h-3z"/><path fill="#241D29" d="M45 54L49 54L47 65L44 63L42 64ZM95 54L91 54L93 65L96 63L98 64Z"/></g>
<g id="little-black-gold-crown"><path fill="#241D29" stroke="#B38A51" stroke-width=".8" d="M60 43L59 35L64 38L68 33L72 38L78 35L79 43Z"/><path fill="none" stroke="#D6AF6C" stroke-width=".65" d="M61 41h16M60 36l4 3 4-5 4 5 6-3"/><circle fill="#241D29" stroke="#D6AF6C" stroke-width=".85" cx="69" cy="39" r="2.7"/><path fill="none" stroke="#D6AF6C" stroke-width=".8" d="M67 41l4-5"/><path fill="#E9CF9A" d="M67 33h1v1h-1zM59 34h1v1h-1zM78 34h1v1h-1z"/></g>`);
}

export async function buildHair(options={}) {
  const sharp=options.sharp || localRequire('sharp');
  const classicRoot=options.classicRoot || path.resolve(projectRoot,'../qq-show-classic');
  const outputRoot=options.outputRoot || path.join(projectRoot,'public/assets-classic');
  const specifications={
    gpt:{source:'浅棕中分长发.gif',label:'银月细卷长发'},
    deepseek:{source:'浅棕中分长发.gif',label:'深海渐蓝卷发'},
    claude:{source:'金色长卷发.gif',label:'蜜橘古典卷发'},
    grok:{source:'白金双马尾.gif',label:'金砂双马尾'},
  };
  const result={};
  for(const [character,spec] of Object.entries(specifications)) {
    const back=await traceHair(sharp,path.join(classicRoot,'back-hair',spec.source),character,spec.label+' · 后发',90);
    const front=await traceHair(sharp,path.join(classicRoot,'front-hair',spec.source),character,spec.label+' · 前发',91);
    const textureSource=character==='grok'?'白金双马尾.gif':'金色长卷发.gif';
    const texture=await traceHair(sharp,path.join(classicRoot,'front-hair',textureSource),character,spec.label+' · 原生细发束',114,78);
    const backSvg=svg(spec.label+' · 后发',looseBack(character)+svgBody(back.svg)+longNativeTexture(character,texture));
    const frontSvg=svg(spec.label+' · 前发',svgBody(front.svg)+frontLocks(character));
    const accessory=headwear(character);
    const directory=path.join(outputRoot,character);
    await fs.mkdir(directory,{recursive:true});
    await fs.writeFile(path.join(directory,'hair-back.svg'),backSvg);
    await fs.writeFile(path.join(directory,'hair-front.svg'),frontSvg);
    await fs.writeFile(path.join(directory,'headwear.svg'),accessory);
    result[character]={hairBack:backSvg,hairFront:frontSvg,headwear:accessory,references:[`back-hair/${spec.source}`,`front-hair/${spec.source}`,`front-hair/${textureSource}`],bounds:{back:await vectorBounds(sharp,backSvg),front:await vectorBounds(sharp,frontSvg)},colors:{back:back.colors,front:front.colors},adaptation:'Original native scalp trace, custom standard-character long silhouette, whole-pixel translated native strand textures; default face and canvas unchanged.'};
  }
  return result;
}

export async function renderDefaultHairBoard(options={}) {
  const sharp=options.sharp || localRequire('sharp');
  const classicRoot=options.classicRoot || path.resolve(projectRoot,'../qq-show-classic');
  const outputRoot=options.outputRoot || path.join(projectRoot,'public/assets-classic');
  const previewRoot=options.previewRoot || path.join(projectRoot,'previews/classic');
  const [bottom,top,face]=await Promise.all(['bottom/default.gif','top/default.gif','makeup/default.png'].map(file=>sharp(path.join(classicRoot,file),{page:0,pages:1}).png().toBuffer()));
  const placements=[];
  let column=0;
  for(const id of ['default','gpt','deepseek','claude','grok']) {
    const back=await sharp(id==='default'?path.join(classicRoot,'back-hair/default.gif'):path.join(outputRoot,id,'hair-back.svg'),{page:0,pages:1}).png().toBuffer();
    const front=await sharp(id==='default'?path.join(classicRoot,'front-hair/default.gif'):path.join(outputRoot,id,'hair-front.svg'),{page:0,pages:1}).png().toBuffer();
    const wear=id==='default'?null:await sharp(path.join(outputRoot,id,'headwear.svg')).png().toBuffer();
    const merged=await sharp({create:{width:140,height:226,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([back,bottom,top,face,front,...(wear?[wear]:[])].map(input=>({input,left:0,top:0}))).png().toBuffer();
    placements.push({input:await sharp(merged).resize(280,452,{kernel:'nearest'}).png().toBuffer(),left:24+column*300,top:42});
    placements.push({input:Buffer.from(`<svg width="280" height="26"><text x="140" y="20" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#3a304e">${id}</text></svg>`),left:24+column*300,top:6});
    column++;
  }
  await fs.mkdir(previewRoot,{recursive:true});
  const filename=path.join(previewRoot,'hair-default-board.png');
  await sharp({create:{width:1524,height:518,channels:4,background:'#eeeaf4'}}).composite(placements).png().toFile(filename);
  return filename;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await buildHair();
  await renderDefaultHairBoard();
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([id,r])=>[id,{references:r.references,bounds:r.bounds,colors:r.colors}])),null,2));
}
