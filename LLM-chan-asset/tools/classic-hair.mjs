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
  qwen: { hue: 236, saturation: .43, low: .17, high: .91, gamma: .90 },
  gemini: { hue: 244, saturation: .64, low: .17, high: .92, gamma: .88 },
  glm: { hue: 222, saturation: .20, low: .025, high: .37, gamma: 1.05 },
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
  if (character === 'gemini') {
    const lower = Math.max(0, Math.min(1, (y - 77) / 63));
    hue += lower * 39;
    lightness = Math.min(.95, lightness + lower * .10);
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
  qwen:{outline:'#343254',deep:'#414573',shadow:'#5E67A1',base:'#7E8AC4',light:'#ABB8E8',highlight:'#E0E3FA'},
  gemini:{outline:'#37305E',deep:'#4B438D',shadow:'#685BC1',base:'#8B83E5',light:'#AEA9FC',highlight:'#DFD9FF',pink:'#D9A4F2'},
  glm:{outline:'#171820',deep:'#20212A',shadow:'#303542',base:'#414958',light:'#64718B',highlight:'#9AAAC1'},
};

const svgBody=value=>value.slice(value.indexOf('>')+1,value.lastIndexOf('</svg>')).replace(/<title>[\s\S]*?<\/title>/g,'').replace(/<desc>[\s\S]*?<\/desc>/g,'');
const fillPath=(fill,d,extra='')=>`<path fill="${fill}" d="${d}"${extra}/>`;

function looseBack(character) {
  const p=HAIR_COLORS[character];
  if(['qwen','gemini','glm'].includes(character))return atlasLongBack(character,p);
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
  if(['qwen','gemini','glm'].includes(character))return atlasFrontLocks(character,p);
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
  if(character==='glm')return `<defs><clipPath id="${key}"><path d="M45 74H96L105 175L35 178Z"/></clipPath></defs><g id="native-straight-hair-texture" clip-path="url(#${key})"><g transform="translate(0 12)">${body}</g><g transform="translate(-3 40)">${body}</g><g transform="translate(3 65)">${body}</g></g>`;
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

function atlasLongBack(character,p) {
  const isStraight=character==='glm';
  const gradient=character==='gemini' ? `<defs><linearGradient id="gemini-long-hair" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="${p.light}"/><stop offset=".45" stop-color="${p.base}"/><stop offset=".8" stop-color="${p.pink}"/><stop offset="1" stop-color="#B895EC"/></linearGradient></defs>` : '';
  let body=gradient+'<g id="atlas-long-hair-silhouette">';
  const outline=isStraight ? 'M51 53Q69 43 89 54L94 86Q98 118 103 145L109 171L102 166L101 179L92 170L90 179L81 171L74 180L65 173L58 179L50 171L42 177L43 166L33 171Q42 144 43 119L45 86Z' : 'M52 54Q70 44 88 55L96 88Q102 111 97 137L103 154L94 151L91 164L81 158L73 166L64 159L56 165L48 156L38 158L41 147Q35 130 42 109L45 85Z';
  body+=fillPath(isStraight?p.deep:character==='gemini'?'url(#gemini-long-hair)':p.base,outline,` stroke="${p.outline}" stroke-width=".8"`);
  if(isStraight) {
    for(const [x,dx,length] of [[49,-10,108],[54,-6,117],[60,-3,111],[65,0,120],[73,2,117],[80,6,111],[87,9,119],[91,13,108]]) {
      body+=`<path fill="none" stroke="${x%2?p.shadow:p.light}" stroke-width="${x%2?1.3:.7}" d="M${x} 64Q${x-2} 105 ${x+dx} ${64+length}"/>`;
      body+=`<path fill="none" stroke="${p.base}" stroke-width=".6" d="M${x+2} 75Q${x+1} 118 ${x+dx+2} ${65+length}"/>`;
    }
    body+=`<path fill="none" stroke="${p.light}" stroke-width=".65" d="M47 79Q38 112 38 138Q36 154 31 160M93 82Q106 113 103 141Q103 154 110 162M52 101Q45 135 48 165M88 99Q97 132 96 163"/>`;
  } else {
    const locks=[
      ['M51 65C43 79 49 90 41 105C35 117 42 128 38 139C35 147 30 149 33 154C42 158 49 148 47 140C44 128 42 120 48 111C56 98 53 81 58 69Z','M51 75C47 88 50 96 44 108C38 120 46 130 42 141Q40 150 36 151'],
      ['M59 75C51 92 57 106 50 119C44 130 52 139 48 149L44 159Q57 162 59 148C60 139 54 133 58 124C65 110 62 93 66 78Z','M59 84C55 98 60 108 54 120C48 131 57 139 54 150L50 157'],
      ['M65 83C61 103 67 117 62 131C58 144 63 151 59 162Q69 167 70 151C68 140 73 128 73 115L73 86Z','M66 93Q64 113 67 125Q62 139 66 151L64 160'],
    ];
    for(const mirrored of [false,true]){
      body+=`<g${mirrored?' transform="translate(140 0) scale(-1 1)"':''}>`;
      for(const [i,[shape,shine]]of locks.entries()){
        body+=fillPath(character==='gemini'?'url(#gemini-long-hair)':i===1?p.light:p.base,shape,` stroke="${p.outline}" stroke-width=".65"`);
        body+=`<path fill="none" stroke="${character==='gemini'&&i===0?p.pink:p.light}" stroke-width="1.7" d="${shine}"/><path fill="none" stroke="${p.highlight}" stroke-width=".65" d="${shine}"/>`;
      }
      body+='</g>';
    }
    if(character==='gemini')body+=`<g fill="none" stroke-width=".7"><path stroke="${p.outline}" d="M44 102Q31 105 34 115Q38 124 29 128M97 112Q112 119 106 130Q102 139 112 143M42 143Q29 148 36 157M96 145Q109 150 103 160"/><path stroke="${p.pink}" d="M43 106Q33 111 38 119M97 116Q107 121 103 131M95 149Q104 153 100 158"/></g>`;
  }
  return body+'</g>';
}

function atlasFrontLocks(character,p) {
  let body='<g id="atlas-front-locks">';
  const bangs=character==='glm' ? [
    ['M58 47Q65 43 69 48L68 62L64 60L62 64Q58 59 57 53Z','M61 49Q61 55 64 59'],
    ['M70 46Q77 44 81 50L83 62L78 60L76 64Q71 58 70 46Z','M74 48L76 57'],
  ] : [
    ['M58 47Q65 43 70 48Q67 56 72 64Q65 64 62 58L58 64Q60 56 56 51Z','M61 49Q61 55 65 59'],
    ['M72 46Q79 45 83 51Q80 56 85 63Q78 62 76 55L75 60Q70 55 72 46Z','M75 48Q74 53 79 57'],
  ];
  for(const[shape,shine]of bangs)body+=fillPath(p.base,shape,` stroke="${p.outline}" stroke-width=".6"`)+`<path fill="none" stroke="${p.light}" stroke-width="1" d="${shine}"/>`;
  if(character==='qwen'){
    body+=fillPath(p.light,'M50 74Q47 90 54 102Q57 109 52 119Q61 117 59 108L55 94L54 80Z',` stroke="${p.outline}" stroke-width=".65"`);
    body+=`<path fill="none" stroke="${p.highlight}" stroke-width=".7" d="M52 83Q50 95 56 104Q59 111 55 115"/>`;
    body+='<g id="qwen-right-shoulder-braid">';
    for(let n=0;n<7;n++){
      const y=75+n*6,x=88+(n<3?0:n<5?-1:-2);
      body+=fillPath(n%2?p.base:p.light,`M${x} ${y}q7-4 8 1l-2 5-4 3-4-3q-1-3 2-6Z`,` stroke="${p.outline}" stroke-width=".65"`);
      body+=`<path fill="none" stroke="${p.highlight}" stroke-width=".7" d="M${x+1} ${y+1}l4 3-4 3"/><path fill="none" stroke="${p.shadow}" stroke-width="1" d="M${x+6} ${y+1}l-4 4"/>`;
    }
    body+=fillPath('#33395F','M86 117l-5-3-1 5 5 2 3-2 4 3 4-4-2-3-5 2Z',' stroke="#B4A278" stroke-width=".6"')+fillPath(p.base,'M86 121Q83 129 87 133L91 134Q87 127 90 122Z',` stroke="${p.outline}" stroke-width=".6"`);
    body+='</g>';
  } else if(character==='gemini'){
    body+=`<path fill="none" stroke="${p.outline}" stroke-width="1.5" d="M68 46Q63 36 69 32Q74 29 77 33"/><path fill="none" stroke="${p.light}" stroke-width=".65" d="M68 44Q65 36 70 33Q74 31 76 33"/>`;
    for(const mirrored of [false,true])body+=`<g${mirrored?' transform="translate(140 0) scale(-1 1)"':''}>${fillPath(p.base,'M51 74Q48 87 54 96Q61 106 54 114Q64 112 62 104Q60 96 57 91L56 80Z',` stroke="${p.outline}" stroke-width=".6"`)}<path fill="none" stroke="${p.pink}" stroke-width="1.5" d="M53 85Q52 93 58 100Q62 107 58 111"/><path fill="none" stroke="${p.highlight}" stroke-width=".6" d="M53 82Q51 91 56 97"/></g>`;
  } else {
    for(const mirrored of [false,true])body+=`<g${mirrored?' transform="translate(140 0) scale(-1 1)"':''}>${fillPath(p.deep,'M50 72L55 79Q53 102 49 124L45 147L46 128L47 105Z',` stroke="${p.outline}" stroke-width=".65"`)}<path fill="none" stroke="${p.light}" stroke-width=".7" d="M51 80L50 106L47 135"/><path fill="none" stroke="${p.base}" stroke-width="1.2" d="M53 84Q52 113 48 133"/></g>`;
  }
  return body+'</g>';
}

function atlasHeadwear(character) {
  if(character==='qwen')return svg('千问 藏蓝白边斜帽与流苏',`<g id="qwen-tilted-hat"><path d="M45 47Q45 35 59 31Q66 29 70 34L57 52Z" fill="#313358" stroke="#343254" stroke-width=".9"/><path d="M45 47L48 50L70 35L68 31Q64 28 62 31L47 44Z" fill="#EEEBF8" stroke="#8E8BAB" stroke-width=".6"/><path d="M49 43L61 33M52 44L63 35" fill="none" stroke="#B4A278" stroke-width=".6"/><path d="M45 49L40 47L38 52L44 55L48 52L50 57L55 53L52 48L48 49Z" fill="#E9E5F5" stroke="#777896" stroke-width=".7"/><path d="M42 54L40 64L43 62L46 65L48 54M48 53L49 62L52 61L54 64L53 53" fill="#CECDE7" stroke="#7C7A99" stroke-width=".6"/><path d="M46 48l-3 2 1 5 4 2 5-3-1-5Z" fill="#444E8D" stroke="#BEA77B" stroke-width="1"/><path d="M47 49l3 1-1 2-2-1-1 3-2-1 2-2Z" fill="#FFF9F6"/><path d="M41 62v8" stroke="#C6B38B"/><path d="M39 70l2-2 2 2-1 7h-3Z" fill="#7D92D7" stroke="#434976" stroke-width=".7"/><path d="M40 71v5M42 71v4" stroke="#CCD5FA" stroke-width=".6"/></g>`);
  if(character==='gemini')return svg('Gemini 猫耳与四色星发饰',`<g id="gemini-cat-ears"><path d="M48 50L42 31L58 39L61 47ZM80 46L91 28L94 49L88 54Z" fill="#8F8ADA" stroke="#37305E" stroke-width="1"/><path d="M47 44L45 35L55 41L53 47ZM84 44L90 33L91 47L87 49Z" fill="#E7ACD8" stroke="#B779AD" stroke-width=".6"/><path d="M49 43l-1-3 4 2-1 3 3 2-4 1ZM87 43l2-6 1 6-2 2 2 2-4 1Z" fill="#F7E5F5"/></g><g id="gemini-four-color-star"><path d="M88 46L91 53L98 56L91 59L88 66L85 59L78 56L85 53Z" fill="#7763B7" stroke="#D9BE86" stroke-width="1.1"/><path d="M88 47L88 56L80 56L85 53Z" fill="#F6C1E8"/><path d="M88 47L91 53L96 56L88 56Z" fill="#A795F4"/><path d="M88 56L96 56L91 59L88 64Z" fill="#B7DDF5"/><path d="M80 56L88 56L88 64L85 59Z" fill="#729BE5"/><path d="M88 50L88 54L84 56L88 57L89 61" fill="none" stroke="#FFF4F7" stroke-width=".6"/><path d="M94 64l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#AEA6F3" stroke="#D7BC8B" stroke-width=".7"/></g>`);
  return svg('GLM 狐耳睡眠眼罩与双银铃',`<g id="glm-wide-fox-ears"><path d="M51 44L31 39L36 48L45 55L54 54L58 47ZM86 44L108 38L102 49L94 55L85 53L81 47Z" fill="#24252D" stroke="#171820" stroke-width=".9"/><path d="M37 43l10 3 6 4-7 2-6-5 2 1ZM101 43l-10 3-6 4 8 2 6-5-2 1Z" fill="#D9D7E1"/><path d="M40 46l4 2-1 2 5-1 3 2M99 46l-4 2 1 2-5-1-3 2" fill="none" stroke="#8C8C9D" stroke-width=".7"/></g><g id="glm-ruffled-maid-band"><path d="M48 49L49 43L53 43L54 39L58 40L60 36L64 38L67 35L71 37L75 35L79 39L83 38L85 42L89 42L91 49L88 52L50 52Z" fill="#DEDCE5" stroke="#777586" stroke-width=".7"/><path d="M51 48L54 43L58 44L61 40L65 41L68 38L72 41L76 39L80 43L84 43L88 48" fill="none" stroke="#FFF9FD" stroke-width="1.8"/><path d="M49 48Q69 35 90 48L88 53Q68 42 51 53Z" fill="#24252E" stroke="#636476" stroke-width=".6"/></g><g id="glm-forehead-sleep-mask"><path d="M54 47Q61 42 69 45Q77 42 84 47L82 55Q76 58 70 53Q64 58 56 55Z" fill="#20212A" stroke="#ACA8B8" stroke-width=".7"/><path d="M57 49Q61 53 65 49M73 49Q77 53 81 49M58 51l-1 2m4-1v2m3-3 1 2m10-1-1 2m4-2v2m3-3 1 2" fill="none" stroke="#F8F3FB" stroke-width=".7"/></g><g id="glm-z-ribbon-and-silver-bells"><path d="M90 52l-4 1 1 7 5 2 3-3 6 2-1-8-6 1Z" fill="#202633" stroke="#607B9D" stroke-width=".6"/><path d="M92 60l-2 18 4-3 2 3 1-17M97 60l2 12 3-1 2 3-2-15" fill="#EEEAF3" stroke="#7C7C91" stroke-width=".6"/><path d="M88 54l8-2 2 8-8 2Z" fill="#171A23" stroke="#BCB8C9" stroke-width=".8"/><path d="M90 55l5-1-3 5 4-1" fill="none" stroke="#FFF8FD" stroke-width="1.1"/><path d="M92 63v11M99 63v9" stroke="#ADB9CD" stroke-width=".7"/><circle cx="92" cy="77" r="3.3" fill="#BEC1CE" stroke="#565663" stroke-width=".7"/><circle cx="99" cy="75" r="3.1" fill="#D8D7E1" stroke="#565663" stroke-width=".7"/><path d="M89 77q3-3 6 0M96 75q3-3 6 0M92 77v3M99 75v3" fill="none" stroke="#4D4C5B" stroke-width=".7"/><path d="M90 75l2-1M97 73l2-1" stroke="#FFFAFD"/></g>`);
}

function headwear(character) {
  if(['qwen','gemini','glm'].includes(character))return atlasHeadwear(character);
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
    qwen:{source:'浅棕中分长发.gif',label:'千问 蓝紫长卷与侧麻花辫'},
    gemini:{source:'浅棕中分长发.gif',label:'Gemini 蓝紫粉渐变长卷发'},
    glm:{source:'深褐长直发.gif',label:'GLM 墨黑冷蓝长直发'},
  };
  const result={};
  for(const [character,spec] of Object.entries(specifications)) {
    const back=await traceHair(sharp,path.join(classicRoot,'back-hair',spec.source),character,spec.label+' · 后发',90);
    const front=await traceHair(sharp,path.join(classicRoot,'front-hair',spec.source),character,spec.label+' · 前发',91);
    const textureSource=character==='grok'?'白金双马尾.gif':character==='glm'?'深褐长直发.gif':'金色长卷发.gif';
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
  const ids=['default','gpt','deepseek','claude','grok','qwen','gemini','glm'];
  let column=0;
  for(const id of ids) {
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
  await sharp({create:{width:ids.length*300+24,height:518,channels:4,background:'#eeeaf4'}}).composite(placements).png().toFile(filename);
  return filename;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await buildHair();
  await renderDefaultHairBoard();
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([id,r])=>[id,{references:r.references,bounds:r.bounds,colors:r.colors}])),null,2));
}
