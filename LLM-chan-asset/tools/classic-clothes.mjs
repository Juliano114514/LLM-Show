import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { GPT_COLORS } from './classic-theme.mjs';

// Every skin pixel stays on the original default-standing-v1 coordinates.
// SVG paths are horizontal colour runs, not embedded bitmap images.
const W = 140, H = 226;
const themes = {
  gpt: { ink:GPT_COLORS.contour, shade:GPT_COLORS.shadow, mid:GPT_COLORS.mid, light:GPT_COLORS.pearl, shine:GPT_COLORS.highlight, metal:GPT_COLORS.metal, dark:GPT_COLORS.deep },
  deepseek: { ink:'#1c315b', shade:'#2e4c7e', mid:'#517cb0', light:'#a6cfed', shine:'#edfaff', metal:'#d6b56e', dark:'#182d55' },
  claude: { ink:'#684333', shade:'#b96b34', mid:'#eaa557', light:'#ffe2ae', shine:'#fff9e9', metal:'#c7984b', dark:'#413331' },
  grok: { ink:'#211e31', shade:'#332b42', mid:'#514459', light:'#7f6a7f', shine:'#cbb3c2', metal:'#d7ac5d', dark:'#201b2b' },
  qwen: { ink:'#2c2b58', shade:'#3b3c78', mid:'#6267a9', light:'#9aabe1', shine:'#f5f2fc', metal:'#c9b18a', dark:'#292b59' },
  gemini: { ink:'#292650', shade:'#353566', mid:'#6467ae', light:'#a4b5ef', shine:'#fff4fc', metal:'#d6b88f', dark:'#282649' },
  glm: { ink:'#191920', shade:'#292b38', mid:'#45495e', light:'#858b9e', shine:'#faf7fc', metal:'#c1c2cd', dark:'#22232d' },
};
const esc = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function rgb(hex) { return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)); }
function shade(rgbIn, stops, low=80, high=255) {
  const lum=.2126*rgbIn[0]+.7152*rgbIn[1]+.0722*rgbIn[2];
  const at=Math.max(0,Math.min(stops.length-1,(lum-low)/(high-low)*(stops.length-1)));
  const i=Math.floor(at), f=at-i, a=rgb(stops[i]), b=rgb(stops[Math.min(i+1,stops.length-1)]);
  return a.map((c,n)=>Math.round(c+(b[n]-c)*f));
}
function trace({data,info}, mapper, include=()=>true) {
  const groups=new Map();
  for(let y=0;y<info.height;y++) {
    let start=-1, previous=null;
    const flush=x=>{if(start<0)return;const key=previous.join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(`M${start} ${y}h${x-start}v1h-${x-start}z`);start=-1;};
    for(let x=0;x<=info.width;x++) {
      const p=(y*info.width+x)*4;
      let colour=x<info.width&&data[p+3]>0&&include(x,y,[data[p],data[p+1],data[p+2]]) ? mapper([data[p],data[p+1],data[p+2]],x,y) : null;
      if(colour&&colour.length===3)colour=[...colour,data[p+3]];
      if(!colour || (previous&&colour.some((n,i)=>n!==previous[i])))flush(x);
      if(colour&&start<0){start=x;previous=colour;}
    }
  }
  return [...groups.entries()].map(([key,runs])=>{const [r,g,b,a]=key.split(',').map(Number);return `<path fill="rgb(${r},${g},${b})"${a<255?` fill-opacity="${(a/255).toFixed(3)}"`:''} d="${runs.join('')}"/>`;}).join('');
}
const p=(d,fill,stroke=null,sw=1)=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter"`:''}/>`;
const line=(d,stroke,sw=1)=>p(d,'none',stroke,sw);
const rect=(x,y,w,h,fill)=>`<path fill="${fill}" d="M${x} ${y}h${w}v${h}h-${w}z"/>`;
function gem(x,y,c,t) {return p(`M${x} ${y-2}l2 2-2 3-2-3z`,c,t.ink)+rect(x,y-1,1,1,t.shine);}
function bow(x,y,c,edge='#6f577c') {return p(`M${x} ${y}l-5-3-1 5 6-1 5 2 1-5z`,c,edge)+rect(x-1,y-1,2,2,edge)+line(`M${x} ${y+1}l-2 5m3-5 2 5`,c);}
function flower(x,y,c,centre) {return [rect(x-1,y-3,2,2,c),rect(x-3,y-1,2,2,c),rect(x+1,y-1,2,2,c),rect(x-1,y+1,2,2,c),rect(x-1,y-1,2,2,centre)].join('');}
function knot(x,y,t) {
  return `<g fill="none" stroke="${t.metal}" stroke-width="1"><path d="M${x-3} ${y}c-3-5 4-7 4-2s-7 6-6 1 8-6 7-1-7 6-6 0 7-6 6 0-5 4-5 0"/></g>`;
}
function ring(x,y,t,rx=3,ry=2.5) {return `<g shape-rendering="geometricPrecision" fill="${t.dark}" stroke="${t.metal}" stroke-width="1"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/><path d="M${x-rx-1} ${y+ry+1}l${rx*2+2}-${ry*2+2}" fill="none" stroke-width=".8"/></g>`;}
function tassel(x,y,t,length=7) {return gem(x,y,t.metal,t)+line(`M${x} ${y+3}v${length}`,t.metal)+line(`M${x-1} ${y+5}v${length-2}m2-${length-2}v${length-2}`,t.shade);}
function chain(d,t) {return line(d,t.dark,1)+line(d,t.metal,.6);}
function lace(d,colour='#d8d5df') {return line(d,colour,2)+line(d,'#f8f6fa',.7);}
function foliage(x,y,t,scale=1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${line('M0 0l1-9m-1 6-3-2m4-1 3-2m-3 1-3-2',t.metal,.7)}${rect(-3,-6,2,1,t.metal)}${rect(3,-9,2,1,t.metal)}</g>`;
}
function prismStar(x,y,size,t) {
  const outline=`M${x} ${y-size}Q${x+1} ${y-1} ${x+size} ${y}Q${x+1} ${y+1} ${x} ${y+size}Q${x-1} ${y+1} ${x-size} ${y}Q${x-1} ${y-1} ${x} ${y-size}Z`;
  return p(outline,t.metal,t.ink,.6)+p(`M${x} ${y-size+1}L${x} ${y}L${x-size+1} ${y}Z`,'#edf4fc')+p(`M${x} ${y-size+1}L${x+size-1} ${y}L${x} ${y}Z`,'#b78be3')+p(`M${x} ${y}L${x+size-1} ${y}L${x} ${y+size-1}Z`,'#6e91d6')+p(`M${x} ${y}L${x} ${y+size-1}L${x-size+1} ${y}Z`,'#a5dce7');
}
function blueDiamond(x,y,t,size=2) {
  return p(`M${x} ${y-size}l${size} ${size}-${size} ${size+1}-${size}-${size+1}z`,'#6488c0',t.metal,.7)+line(`M${x} ${y-size+1}v${size+1}`,t.shine,.7);
}
function newTopDetails(id,t) {
  if(id==='qwen') return p('M64 86h11l2 8-7 5-7-5z','url(#white-fold)',t.ink)+
    p('M63 94l7 4 7-4 4 10-2 20H59l1-20z','url(#white-fold)',t.ink)+
    line('M70 97v25M64 101l-2 12 2 7M77 100l2 13-3 9','#b8bed5',.7)+
    [100,106,112].map(y=>line(`M67 ${y}h6m-6-1-1 1 1 1m6-2 1 1-1 1`,t.metal,.7)).join('')+
    blueDiamond(70,103,t)+
    p('M57 98l-5 4-5 12-7 9 5 6 12-14 6-14z','url(#cloth)',t.ink)+
    p('M82 98l5 4 5 12 7 9-5 6-12-14-6-14z','url(#cloth)',t.ink)+
    p('M50 111l-9 9-5 29 10 6 5-19 6-15z',t.dark,t.ink)+
    p('M89 111l9 9 6 29-10 6-6-19-6-15z',t.dark,t.ink)+
    p('M49 115l-6 9-4 22 5 4 5-17 5-16z',t.shade)+
    p('M90 115l6 9 5 22-5 4-5-17-5-16z',t.shade)+
    line('M51 110l-9 14-4 24 7 4 8-29M88 110l9 14 5 24-7 4-8-29',t.metal,.8)+
    line('M49 119l-5 15-2 11m48-26 5 15 3 11',t.mid)+
    line('M44 136l2-2 2 2-2 2 2 2-3 3m51-7-2-2-2 2 2 2-2 2 3 3',t.metal,.6)+
    p('M59 120h21l2 6-11 4-14-4z',t.mid,t.ink)+line('M59 122l10 4 12-3',t.metal)+
    knot(59,125,t)+blueDiamond(79,126,t)+tassel(79,130,t,9);
  if(id==='gemini') return p('M65 86l5 4 5-4 2 8-7 5-7-5z',t.dark,t.metal,.7)+
    p('M63 95l7 3 7-3 4 8-2 8-9-3-9 3-2-8z',t.dark,t.ink)+
    p('M65 96l5 4 6-4 2 5-8 5-8-5z','url(#white-fold)',t.metal,.6)+
    p('M60 104l10 4 10-4-2 9-8-2-8 2z',t.shade,t.ink)+
    line('M61 111l8-3 9 4',t.metal,.8)+prismStar(70,106,3,t)+
    p('M54 102l5 3-6 11-9 12-5-5 9-12z','url(#cloth)',t.ink)+
    p('M85 102l-5 3 6 11 9 12 5-5-9-12z','url(#cloth)',t.ink)+
    lace('M52 102l2-2 2 2 3-1 1 3m20 0 1-3 3 1 2-2 2 2','#c4c0da')+
    p('M47 115l-8 7-3 25 8 8 8-18 4-15z',t.dark,t.metal,.8)+
    p('M93 115l8 7 3 25-8 8-8-18-4-15z',t.dark,t.metal,.8)+
    p('M45 122l-5 4-1 20 5 5 6-16 3-12z','url(#white-fold)',t.ink,.7)+
    p('M95 122l5 4 1 20-5 5-6-16-3-12z','url(#white-fold)',t.ink,.7)+
    line('M44 127l-2 13 2 6m51-19 3 13-2 6','#c8bfdc')+
    prismStar(42,123,3,t)+prismStar(98,123,3,t)+
    line('M69 116l1 1-1 2','#cf986a',.7)+
    chain('M60 123q9 6 20-1',t)+prismStar(71,125,2,t);
  return p('M64 86l2 2 2-1 2 2 2-2 2 1 2-2 1 8-7 5-7-5z','url(#white-fold)',t.ink)+
    p('M60 94l10 4 9-4 3 17-3 13H59l-2-13z','url(#white-fold)',t.ink)+
    line('M63 100l1 16m4-16 1 18m5-18-1 17m5-16-1 15','#bdbecc',.7)+
    p('M57 94l-5 4-4 11 3 7 9-8 3-9z','url(#white-fold)',t.ink)+
    p('M82 94l5 4 4 11-3 7-9-8-3-9z','url(#white-fold)',t.ink)+
    p('M50 107l6 4-4 10-9 9-6-6 8-14z','url(#white-fold)',t.ink)+
    p('M89 107l-6 4 4 10 9 9 6-6-8-14z','url(#white-fold)',t.ink)+
    line('M52 100l1 5 4 2m28-7-1 5-4 2M47 112l-3 10m4-8 1 7m43-9 3 10m-4-8-1 7','#c0bfcd')+
    p('M39 121l9 5-3 5-9-5z',t.dark,t.ink)+p('M100 121l-9 5 3 5 9-5z',t.dark,t.ink)+
    lace('M37 125l-1 2 3 1 1 3 3-1 2 2m55-7 1 2-3 1-1 3-3-1-2 2','#dbdbe3')+
    bow(46,125,t.dark,t.ink)+bow(94,125,t.dark,t.ink)+
    p('M67 95l-8-2-1 7 9-1-3 10 6-3 5 3-2-10 8 1-1-7-8 2z',t.dark,t.ink)+
    line('M60 95l6 2m8 0 5-2M66 102l4 2 3-2','#6688ba',.7)+
    p('M67 95h6l1 5h-7z',t.dark,t.metal,.6)+line('M68 96h4l-4 3h4',t.shine,.7)+
    rect(69,110,2,2,t.dark)+rect(69,116,2,2,t.dark)+
    p('M58 121h23l2 6-14 3-13-3z',t.dark,t.ink)+line('M59 123l11 3 11-2','#6485b8',.7)+
    chain('M59 126q8 7 20 1',t)+blueDiamond(79,130,t)+tassel(79,134,t,8);
}
function topDetails(id,t) {
  if(['qwen','gemini','glm'].includes(id)) return newTopDetails(id,t);
  if(id==='gpt') return p('M64 86h11l1 7-6 4-6-4z',t.light,t.ink)+line('M66 87v5l4 3 4-3v-5',t.metal)+knot(70,90,t)+
    p('M65 93l5 4 5-4 5 9-1 22H59l1-22z','url(#white-fold)',t.ink)+
    p('M65 99l-4 6v14l6 3-2-10 3-9z',t.mid)+line('M68 100l-3 3 7 4-6 4 7 4-6 4',t.metal,.6)+tassel(70,111,t,6)+
    p('M54 98l5 2-4 11-9 13-6-1 6-13z',t.light,t.ink)+p('M50 110l-9 12-2 21 6 5 3-8 6-14 2-12z','url(#white-fold)',t.ink)+
    p('M44 125l-3 13 4 7 3-8 4-12z',t.mid)+line('M53 105l-6 11-4 17m6-16-3 21',t.shine)+chain('M44 121l4 3',t)+tassel(43,126,t,7)+
    p('M84 98l-5 2 4 11 9 13 6-1-6-13z',t.light,t.ink)+p('M88 110l9 12 2 21-6 5-3-8-6-14-2-12z','url(#white-fold)',t.ink)+
    p('M94 125l3 13-4 7-3-8-4-12z',t.mid)+line('M85 105l6 11 4 17m-6-16 3 21',t.shine)+chain('M92 124l4-3',t)+tassel(95,126,t,7)+
    chain('M60 120q10 6 20 0',t)+knot(59,122,t)+tassel(78,124,t,8);
  if(id==='deepseek') return p('M64 87l2 2 2-1 2 2 2-2 2 1 2-2 1 7-7 4-7-4z','#eeedf5',t.ink)+
    p('M62 96h16l2 14-3 6H62l-2-6z','url(#white-fold)',t.ink)+line('M64 98v13m3-14v16m5-16v16m4-15v13','#c7c8da')+
    p('M57 93l-5 5-3 12-8 12 5 5 11-14 5-12z','url(#cloth)',t.ink)+p('M82 93l5 5 3 12 8 12-5 5-11-14-5-12z','url(#cloth)',t.ink)+
    p('M57 94l-3 1-1 7 5 3 4-7z',t.shade,t.ink)+p('M81 94l4 1 1 7-5 3-4-7z',t.shade,t.ink)+
    line('M53 101l-2 9-6 10m41-19 2 9 6 10',t.mid)+
    lace('M41 121l-1 2 3 1-1 3 3-1 1 3 2-3m46-5 1 2-3 1 1 3-3-1-1 3-2-3','#b7bed4')+
    p('M42 119l5 3-2 4-5-3z',t.dark,t.metal,.7)+p('M93 119l-5 3 2 4 5-3z',t.dark,t.metal,.7)+
    rect(43,121,1,1,t.metal)+rect(91,121,1,1,t.metal)+
    p('M59 113h21l2 12H58z',t.dark,t.ink)+line('M61 114l-1 10m18-10 1 10',t.shade)+
    rect(63,116,2,2,t.metal)+rect(75,116,2,2,t.metal)+rect(63,121,2,2,t.metal)+rect(75,121,2,2,t.metal)+
    bow(70,96,t.dark,t.ink)+gem(70,95,'#74b5dd',t)+rect(69,104,2,2,t.dark)+rect(69,109,2,2,t.dark)+
    lace('M61 95l-2 2 2 2-2 2 2 2-1 2m18-10 2 2-2 2 2 2-2 2 1 2','#d3d4e1');
  if(id==='claude') return p('M64 87l2 2 2-1 2 2 2-2 2 1 2-2 1 7-7 5-7-5z',t.shine,t.ink)+
    p('M58 94l-5 4-4 13-8 12 5 5 12-14 5-12z','url(#white-fold)',t.ink)+p('M81 94l5 4 4 13 8 12-5 5-12-14-5-12z','url(#white-fold)',t.ink)+
    p('M62 97h16l2 17H60z','url(#white-fold)',t.ink)+line('M63 100l2 12m3-13 1 13m4-13-1 13m5-12-2 12','#d4c5b5')+
    lace('M42 121l-2 2 2 2-1 3 3-1 2 3 2-3m46-6 2 2-2 2 1 3-3-1-2 3-2-3','#c6b7a9')+
    line('M43 120l4 3m44-3-3 3',t.metal)+
    p('M59 113h21l2 13H57z',t.dark,t.ink)+line('M61 114v9m17-9 1 10',t.metal)+rect(63,116,2,2,t.metal)+rect(76,116,2,2,t.metal)+rect(62,121,2,2,t.metal)+rect(77,121,2,2,t.metal)+
    p('M65 93l-8 1-5 10 10 5 7-11z',t.shine,t.ink)+p('M74 93l9 1 5 10-10 5-7-11z',t.shine,t.ink)+
    line('M57 96l-3 7 7 3m21-10 4 7-7 3',t.mid)+flower(58,102,t.mid,t.metal)+flower(82,102,t.mid,t.metal)+
    p('M68 95h4l3 11-5-2-5 2z',t.dark,t.ink)+line('M66 105h8',t.metal)+flower(70,94,t.mid,t.metal)+
    chain('M59 124q10 5 21-1',t)+tassel(80,126,t,7);
  return p('M64 87l6 6 6-6 4 4-5 8H65l-5-8z','#77233b',t.ink)+
    p('M59 97l-4-3-4 5 1 6 7 3 4-7z',t.shade,t.ink)+p('M80 97l4-3 5 5-1 6-7 3-4-7z',t.shade,t.ink)+
    p('M53 102l5 3-5 10-9 12-5-5 9-13z','url(#cloth)',t.ink)+p('M86 102l-5 3 5 10 9 12 5-5-9-13z','url(#cloth)',t.ink)+
    line('M54 106l-3 7-7 10m40-17 3 7 7 10',t.mid)+
    lace('M40 122l-2 2 3 1-1 3 3-1 2 3 2-4m48-4 2 2-3 1 1 3-3-1-2 3-2-4','#c9bfce')+
    p('M41 119l7 4-2 4-7-4z',t.dark,t.metal,.7)+p('M94 119l-7 4 2 4 7-4z',t.dark,t.metal,.7)+
    p('M60 99l5 3 5-2 5 2 5-3 1 17-4 9H61l-3-9z','url(#cloth)',t.ink)+
    lace('M60 100l3-1 3 2 4-1 4 1 3-2 3 1','#cbc3ce')+
    line('M64 105l-2 11 2 6m11-17 2 11-2 6','#76606c')+
    gem(70,108,t.metal,t)+bow(70,96,t.dark,t.ink)+ring(70,96,t,2.5,2)+ring(70,118,t)+
    chain('M59 123q4 7 11 5 8 2 12-5',t);
}
function newSkirt(id,t) {
  if(id==='qwen') return p('M56 123h26l6 19 8 27 9 29-9 5-11-2-14 3-13-3-12 1-11-5 9-29 7-25z',t.ink)+
    p('M57 125h24l6 19 8 26 8 27-8 4-10-2-14 3-13-3-12 1-9-4 9-27 7-25z','url(#cloth)')+
    p('M43 190l-6 10 10 5 12-1 13 3 13-3 11 1 7-5-6-10z','url(#white-fold)',t.ink,.7)+
    line('M42 197l4 4m3-4 1 5m7-4 2 5m7-4 1 5m8-5 1 5m7-6 1 5m8-6 1 5m7-6 1 3','#8b91b9')+
    p('M57 126l7 2-8 34-9 31-8 2 9-31z',t.shade)+
    p('M77 126l5 2 9 35 9 33-11 1-10-32-8-36z',t.shade)+
    p('M65 126h10l-1 21 4 24-3 26-10 2-16-4 8-29z','url(#white-fold)',t.ink,.7)+
    p('M69 129h4l-3 29 3 34-7 3-10-2 7-29z','#e3e4f3')+
    line('M65 129l-4 32-8 30M71 131l-3 30 3 31',t.shine)+
    line('M58 128l-8 36-10 29 8 3m33-67 9 35 10 31-10 3',t.metal,.8)+
    line('M45 189l4-1 1-4 4 1 1-4m31 4 3 1 1 4 4-1 2 4M42 193l4 1 4-1m37 2 5-1 5 1',t.metal,.7)+
    line('M55 143l-5 18-4 17m35-35 6 20 5 17',t.mid)+
    foliage(50,183,t,.8)+foliage(90,183,t,.9)+
    knot(60,154,t)+tassel(60,159,t,10)+blueDiamond(72,187,t)+tassel(72,192,t,7)+
    line('M59 176q4-5 7 0t7 0M56 182q5-4 9 1t7-1','#b6beda',.7)+
    chain('M57 127q8 8 24 0',t)+blueDiamond(81,133,t)+tassel(81,137,t,9);
  if(id==='gemini') return p('M57 123h25l8 17 9 28 5 24-8 5-14-35-6-9-9 7-10-3-8 33-11 5 4-28 8-28z',t.ink)+
    p('M58 125h23l8 17 9 27 4 22-6 4-13-34-7-10-9 7-11-3-9 34-7 4 4-26 8-28z','url(#cloth)')+
    p('M57 130l8 3-10 28-9 26-5 4 5-27z',t.shade)+
    p('M80 131l6 8 9 30 6 20-4 3-10-31-8-17z',t.mid)+
    line('M57 128l-10 35-6 29 6-3 10-31m24-29 8 26 11 36-4 3-15-36',t.metal,.8)+
    p('M58 126h23l4 10 4 10-9 10-7-3-7 5-12-3-5-7 5-13z','url(#white-fold)',t.ink,.7)+
    line('M55 137l-3 10 4 6 5-1 5 4 6-5 7 3 8-8','#c6c2df')+
    lace('M50 148l2 4 3 1 1 3 4-1 5 3 4-3 4-1 6 2 4-2 3-4','#d1c5df')+
    p('M58 124l13 3 10-3 4 13-12 13-10-4-9 3-3-4z',t.dark,t.metal,.8)+
    p('M61 129l8 2-5 11-8 3z',t.shade)+p('M74 131l7-4 2 9-9 9-5-1z',t.mid)+
    line('M58 128l-4 15 9-2 9 6 10-11',t.light,.7)+
    chain('M59 128q4 11 19 2',t)+prismStar(79,132,4,t)+prismStar(55,142,2,t)+
    prismStar(45,185,3,t)+prismStar(98,189,3,t)+line('M45 188v7m53-3v7',t.metal,.7)+
    prismStar(45,198,2,t)+prismStar(98,202,2,t);
  return p('M56 123h26l7 21 9 24 7 30-10 5-12-2-13 3-14-3-11 1-11-6 9-28 8-26z',t.ink)+
    p('M57 125h24l7 21 9 23 6 28-9 4-11-2-13 3-14-3-11 1-9-5 9-27 8-26z',t.dark)+
    p('M43 193l-7 6 9 6 11-1 14 4 13-4 12 1 8-5-6-7z',t.mid,t.ink,.7)+
    line('M40 198l4 4m5-4 1 4m7-3 1 4m8-2 1 5m7-5 1 5m8-6 1 5m7-6 1 4m7-6 1 4',t.light,.7)+
    p('M61 125h16l1 21 14 41-9 9-13-2-17 3-10-7 12-37z','url(#white-fold)',t.ink,.8)+
    p('M66 129h7l-3 31 8 30-8 2-12 1 5-34z','#e3e1eb')+
    p('M59 128l7 2-9 23-7 21-7 15-5 4 9-29z',t.shade)+
    p('M78 127l4 1 6 18 9 24-5 5-10-24-10-15z',t.shade)+
    p('M75 128l6 2 3 16 11 25-7 6-11-13-8-17z',t.dark,t.metal,.7)+
    p('M82 155l8 7 7 13-11 3-8-10 8 17-8 4-10-14-3-19z','url(#white-fold)',t.ink,.7)+
    line('M80 157l8 8 6 9-8 2-6-7m-10-8 5 15 5 9-3 2','#a9a8bb',.8)+
    line('M61 133l-5 26-8 29 6 5M69 132l-2 28 5 30M77 136l6 23',t.shine)+
    line('M60 133l-7 27-7 28m31-54 8 18 10 33',t.light,.7)+
    line('M44 191l10 3 16-1 12 2 10-5M40 194l6 4 10-1 14 3 13-3 10 2 7-4',t.metal,.7)+
    line('M42 192l6 2m8 0 6 1m23-1 6-2M60 131l-2 9m26 11 4 11','#6488bb',.6)+
    chain('M57 127q8 11 23 2',t)+blueDiamond(79,133,t)+line('M79 136v24',t.metal,.7)+
    [143,151,159].map(y=>blueDiamond(79,y,t,1)).join('')+
    bow(84,139,t.dark,t.ink)+blueDiamond(84,143,t)+tassel(84,148,t,9)+
    p('M60 179h2v3h-2zM63 182h2v3h-2zM57 182h2v3h-2zM60 185h2v3h-2z',t.dark)+
    blueDiamond(61,191,t)+line('M60 180v8m-3-4h8',t.ink,.6);
}
function skirt(id,t) {
  if(['qwen','gemini','glm'].includes(id)) return newSkirt(id,t);
  if(id==='gpt') return p('M56 123h26l2 15 4 20 4 23 9 21-8 4-12-2-9 2-7-8-4-22-1-22-7-12-5 20-4 20 4 18-6 5-8-4 4-22 6-27 6-20z',t.ink)+
    p('M57 124h24l2 15 4 20 4 23 8 20-6 2-12-2-8 2-6-7-4-22-1-23-7-12-3 7-5 15-4 20 4 17-5 4-6-3 4-22 6-27 6-20z','url(#white-fold)')+
    p('M61 125l9 4 10 21 4 24 9 26-7-3-8-23-4-20-10-17z',t.mid)+
    p('M80 136l5 24 3 21 10 21-5 1-11-21-4-21-5-16z',t.light)+
    p('M50 151l4-11 4 9-7 25-2 18-4 8-1-16z',t.mid)+
    line('M57 129l8 9 8 20 7 29 8 14m-27-68 8 22 7 27m-25-23-4 21 1 16',t.shine)+
    line('M59 140l-4 14-4 22m17-30 5 17 4 22m5-24 4 22',t.shade)+
    chain('M57 126q10 10 23 3l5 11',t)+chain('M54 135q13 12 29 10',t)+knot(55,134,t)+knot(84,147,t)+
    tassel(56,139,t,7)+tassel(69,143,t,9)+tassel(84,151,t,9)+
    line('M39 197l7 2m23-3 6 3 7-1 7 3 7-1',t.metal)+knot(88,195,t)+knot(44,194,t);
  if(id==='deepseek') return p('M56 123h26l5 17 7 23 9 20-9 6-10-2-14 3-12-3-12 1-10-7 9-24 6-20z',t.ink)+
    p('M57 125h24l5 17 7 23 8 17-8 5-10-2-13 3-12-3-11 1-9-6 9-23 6-20z','url(#cloth)')+
    p('M60 130l-8 33-10 16 7 4 8-22 9-31z',t.shade)+p('M77 130l7 34 11 18-9 2-8-24-6-30z',t.mid)+
    p('M62 125h15l2 15 8 22-3 10-12 5-12-3-6-8 5-26z','url(#white-fold)','#b7bdd5')+
    p('M67 128h8l2 15 7 20-3 7-10 4-9-3 4-9 4-16z','#e5e6f0')+
    line('M62 127l-1 15-5 22 5 8 11 3 11-5 2-8-8-22-1-13','#fbfbff')+
    lace('M60 128l-1 7 1 3-3 4 1 4-3 4 1 4-3 5 2 4-1 4 3 4 4 2 3 3 5 1 5-1 5-2 3-4 2-4-1-5-2-4-1-5-3-4-1-5-2-4-1-6','#c5c4d7')+
    p('M65 160q4-5 8 1l4-2-1 5-3-1q-6 3-9-1z',t.shade)+rect(66,160,1,1,t.shine)+line('M71 156l1-2m2 2 1-1',t.mid)+
    lace('M40 180l3 3 3-1 4 3 4-1 5 3 5-1 6 2 6-2 5 1 5-2 4 1 4-3 3 1 3-3','#c6c3d5')+
    line('M41 177l8 5 8-1 13 3 13-3 8 1 7-5',t.metal,.7)+
    foliage(47,174,t,.8)+foliage(91,175,t,.8)+foliage(82,182,t,.7)+bow(55,145,t.mid,t.ink)+bow(85,165,t.mid,t.ink);
  if(id==='claude') return p('M56 123h26l6 21 9 24 7 21-10 5-11-2-13 3-13-3-11 1-10-6 8-25 7-23z',t.ink)+
    p('M57 125h24l6 21 9 24 6 18-9 4-10-2-13 3-13-3-10 1-9-5 8-24 7-22z',t.dark)+
    p('M64 125h13l4 26 9 34-8 5-13-3-12 3-9-5 9-33z','url(#white-fold)')+
    p('M72 126l8 2 8 23-8 3 12 19-9 5-11-18 4-14-8-13z',t.shade)+
    p('M75 128l4 1 6 20-8 2 11 20-5 4-9-17 4-12-6-13z',t.mid)+
    p('M56 127l8 2-6 21 6-2-8 21 4-1-10 20-10-3 8-25z',t.dark)+
    line('M58 129l4 1-6 24 6-2-9 22 4-2-7 14m29-56 7 20-8 3 12 20-7 4',t.metal,.7)+
    line('M66 130l-3 22-6 28m15-48-1 27 5 25m-10-32-4 31',t.shade,.6)+
    lace('M40 186l4 3 5-1 5 3 6-1 7 3 7-2 6 1 6-2 5 1 5-3 4 1','#c9b6a7')+
    line('M42 182l8 3 8-2 11 3 13-3 8 2 10-3',t.mid)+
    flower(54,148,t.mid,t.metal)+bow(54,152,t.dark,t.ink)+tassel(54,157,t,9)+
    flower(85,160,t.mid,t.metal)+bow(85,164,t.dark,t.ink)+tassel(85,170,t,8)+
    chain('M59 126q9 7 21-1',t)+tassel(76,132,t,10)+foliage(53,181,t,.8)+foliage(83,182,t,.9)+foliage(67,184,t,.7);
  return p('M56 123h26l8 18 12 23-6 11 7 17-8 4-10-4-7-12-2-13-6-8-4 15-3 20-12 2-13-7 7-24 6-23z',t.ink)+
    p('M57 125h24l8 18 11 21-6 11 7 16-6 3-9-4-6-11-2-14-8-10-6 18-3 19-10 2-11-6 7-23 6-23z','#74203b')+
    p('M58 125h22l5 18 7 13 7 7-8 5-10-6-8-12-9 18-4 20-9 4-11-6 8-23 5-23z','url(#cloth)')+
    p('M61 129l7 2-8 31-8 23-8-1 8-25z',t.shade)+p('M76 129l5 2 5 17 9 13-7 1-9-16z',t.mid)+
    p('M84 165l8 11 6 13-6 1-8-10-4-18z','#9d314c')+
    p('M42 186l4 2 4-1 5 3 6-1-1 4-5 1-4-2-4 1-5-3z','#75253c',t.ink,.7)+line('M45 188l2 3m4-2 1 3m5-1v2','#a74459')+
    p('M88 184l3 3 3-1 4 4 2-1 1 3-3 2-4-3-3 1-3-4z','#75253c',t.ink,.7)+line('M92 188l1 3m4-1 1 2','#a74459')+
    line('M58 128l7 4-8 29-7 24m28-56 6 17 12 16m-21-10-10 21-3 15',t.metal,.7)+
    lace('M41 184l4 4 4-1 4 3 5-1 3 2m23-13 3 3 1 4 4 3 1 3 4 1','#4d3b4d')+
    chain('M57 126q6 14 14 7 9 10 14 4',t)+chain('M55 136q15 13 31 9',t)+
    ring(55,139,t)+ring(84,146,t)+tassel(56,144,t,8)+tassel(84,151,t,8)+
    foliage(47,179,t,.9)+foliage(90,158,t,.8)+foliage(93,188,t,.8);
}

function shoeDetails(id,t) {
  const cuff = (y,color)=>line(`M52 ${y}h7m14 ${y}h7`,color);
  const sole=line('M50 211h8m13 0h8',t.ink);
  if(id==='qwen') return line('M52 199l5 1m17 0 5-1',t.metal)+blueDiamond(54,205,t)+blueDiamond(76,205,t)+line('M51 209l6-1m16 0 5 1',t.light,.7)+sole;
  if(id==='gemini') return [52,73].map(x=>p(`M${x} 179h6l1 7-1 5 2 5-2 5h-8l1-6-1-5 2-5z`,'url(#white-fold)',t.ink,.7)+line(`M${x+1} 180v4m3-4v4m-4 3 4 2-4 3 4 2-4 3`,'#b8afce',.7)+prismStar(x+1,184,2,t)+p(`M${x-1} 200l6 1 3 7-2 4h-9v-4z`,t.dark,t.ink)+line(`M${x-1} 210h7`,t.light,2)+line(`M${x} 204l5 1`,t.mid,2)+rect(x+1,207,4,1,t.shine)).join('');
  if(id==='glm') return cuff(190,t.dark)+[52,73].map(x=>p(`M${x} 191h6l-1 10 2 6-2 4h-9l1-5 2-6z`,'url(#white-fold)',t.ink,.7)+p(`M${x-2} 206l4-2 4 3 1 4h-10z`,t.dark,t.ink,.7)+line(`M${x+1} 193l3 2-4 2 4 2-4 2 3 2`,t.dark,.8)+line(`M${x+2} 193v9`,t.metal,.6)+bow(x+2,191,t.dark,t.ink)).join('')+sole;
  if(id==='gpt') return cuff(194,t.metal)+line('M51 201l5 1m18 0 5-1',t.metal)+gem(54,204,GPT_COLORS.gem,t)+gem(76,204,GPT_COLORS.gem,t)+sole;
  if(id==='deepseek') return cuff(178,'#eaf8ff')+line('M51 200l6 1m15 0 7-1',t.light)+rect(54,201,1,2,t.metal)+rect(74,200,1,2,t.metal)+sole;
  if(id==='claude') return cuff(189,t.mid)+line('M53 194l4 2-5 3 4 3m17-8 5 2-5 3 5 3',t.ink)+line('M52 193l4 1m18 0 4-1',t.shine)+sole;
  return cuff(188,t.metal)+line('M52 196l5 1m17 0 5-1',t.metal)+ring(54,204,t,2.5,2)+ring(76,204,t,2.5,2)+sole;
}

// Small native-pixel stitches and narrow fabric glints are modelled after the
// original library's satin, lace and metal details, rather than broad shading
// bands. Keep these marks inside the existing garments and away from the skin.
function garmentFinish(id,t,slot) {
  if(slot==='top') {
    const marks={
      gpt:line('M54 103l-4 9m35-9 4 9M43 133l1 6m50-6-1 6',t.shine,.7)+rect(70,90,1,1,t.shine)+rect(78,124,1,1,t.shine),
      deepseek:line('M64 100v3m3-4v4m6-4v4m3-3v3','#fffdfd',.7)+rect(63,116,1,1,t.shine)+rect(75,116,1,1,t.shine)+rect(63,121,1,1,t.shine)+rect(75,121,1,1,t.shine),
      claude:line('M57 97l-2 5 5 2m22-7 2 5-5 2','#fffaf0',.7)+line('M64 101l1 5m8-5-1 5','#fffaf0',.7)+rect(63,116,1,1,t.shine)+rect(76,116,1,1,t.shine),
      grok:line('M63 108l3 2-3 2 3 2-3 2m13-8-3 2 3 2-3 2 3 2',t.metal,.6)+rect(70,107,1,1,t.shine)+rect(54,105,1,2,t.light)+rect(85,105,1,2,t.light),
      qwen:line('M65 89l1 3m7-3-1 3M45 130l-2 7m52-7 2 7',t.shine,.7)+[100,106,112].map(y=>rect(70,y,1,1,t.shine)).join(''),
      gemini:line('M42 132v6m3-10-1 8m52-4v6m-3-10 1 8','#fff5fc',.7)+rect(42,122,1,1,t.shine)+rect(98,122,1,1,t.shine)+rect(70,105,1,1,t.shine),
      glm:line('M63 103l1 5m4-5v6m6-6-1 6m5-5-1 5','#fffafd',.7)+rect(69,110,1,1,t.metal)+rect(69,116,1,1,t.metal)+line('M39 126l4 2m53 0 4-2',t.shine,.6),
    };
    return `<g id="classic-collar-and-cuff-finish">${marks[id]}</g>`;
  }
  if(slot==='bottom') {
    const marks={
      gpt:line('M74 178l2 2m1 3 2 2m1 3 2 2m-37-4-1 3m34 8 4 1m5 1 4 1',t.metal,.65)+flower(79,185,t.shine,t.metal)+line('M78 188l-1 4m3-3 2 2',t.metal,.6),
      deepseek:line('M59 165l1 2m2 3 2 1m3 1 2 1m5-1 2-1m3-2 2-2','#fffdfb',.7)+line('M44 178l2 1m5 2 2 1m7 1 2 1m18-1 2-1m7-1 2-1m4-2 2-1',t.metal,.6),
      claude:line('M55 174l-2 7m1-4 2-2m-3 5-2-1m31-6 2 8m-1-5-2-2m3 6 2-2',t.metal,.65)+line('M49 185l3 1m8 2 3 1m13-1 3-1m10-1 3-1','#fff7e8',.7)+rect(54,173,1,1,t.shine)+rect(82,172,1,1,t.shine),
      grok:line('M47 172l-2 8m1-5 2-2m-3 5-2-1m43-19 2 7m-1-4 2-1',t.metal,.65)+line('M44 185l2 2m8 3 3 1m31-7 2 3m6 3 2 1','#c27489',.7)+rect(56,139,1,1,t.shine)+rect(84,146,1,1,t.shine),
      qwen:line('M43 192h4v-2h4v4h4v-2h3m27 0h3v2h4v-4h4v2h4',t.metal,.6)+line('M58 188q2-3 4-1q2-2 4 0h4M62 193q2-2 4 0h3','#b7bdd8',.6)+rect(81,133,1,1,t.shine),
      gemini:line('M57 151l2 1m5 2 2 1m8-3 2 1m6-2 2-2','#fff4fc',.7)+line('M47 177l-2 7m51-1 2 6',t.light,.7)+rect(79,130,1,1,t.shine)+rect(45,184,1,1,t.shine)+rect(98,188,1,1,t.shine),
      glm:line('M49 188l2 1m5 2 2 1m7 0 2 1m7 0 2 1m9-2 2-1',t.metal,.65)+line('M48 181l2-6m5 10 2-7m29-9 3 5','#faf8fc',.7)+rect(79,143,1,1,t.shine)+rect(79,151,1,1,t.shine)+rect(61,190,1,1,t.shine),
    };
    return `<g id="classic-hem-needlework" clip-path="url(#skirt-interior)">${marks[id]}</g>`;
  }
  const marks={
    gpt:line('M52 205l2 1m21 0 2-1',t.shine,.7),
    deepseek:line('M54 181v4m2-4v4m18-4v4m2-4v4','#fffdfd',.7)+rect(54,204,1,1,t.shine)+rect(76,204,1,1,t.shine),
    claude:rect(53,207,1,1,t.shine)+rect(75,207,1,1,t.shine)+line('M53 197l2 1m19-1 2 1',t.shine,.6),
    grok:rect(54,203,1,1,t.shine)+rect(76,203,1,1,t.shine),
    qwen:rect(54,204,1,1,t.shine)+rect(76,204,1,1,t.shine),
    gemini:rect(52,210,2,1,'#b9d8f3')+rect(55,210,1,1,'#e4c1ee')+rect(73,210,2,1,'#b9d8f3')+rect(76,210,1,1,'#e4c1ee'),
    glm:rect(53,205,1,1,t.shine)+rect(75,205,1,1,t.shine)+line('M52 209h3m18 0h3',t.light,.6),
  };
  return `<g id="classic-shoe-and-stocking-glints">${marks[id]}</g>`;
}

function mixed(a,b,amount) {const aa=rgb(a),bb=rgb(b);return `rgb(${aa.map((v,i)=>Math.round(v+(bb[i]-v)*amount)).join(',')})`;}
function foldDefs(t) {
  const steps=[.7,.54,.34,.12,0,.18,.37,.59,.82,.7];
  return `<linearGradient id="cloth" x1="0" x2=".2" spreadMethod="reflect">${steps.map((value,i)=>`<stop offset="${i/9}" stop-color="${mixed(t.light,t.shade,value)}"/>`).join('')}</linearGradient>`;
}
function skirtTexture(source,id,t,markup) {
  // Reuse only the original grey skirt's luminance structure. It is reprojected
  // into the new skirt and clipped inside its editable silhouette; no skin is copied.
  const boxes={gpt:[35,124,100,206],deepseek:[37,124,102,190],claude:[37,124,103,195],grok:[39,124,102,196],qwen:[35,124,105,207],gemini:[38,124,104,204],glm:[34,124,105,208]};
  const [left,top,right,bottom]=boxes[id], data=Buffer.alloc(W*H*4);
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++) {
    // Keep the source material's native 1px rows. Stretching a 19px skirt over
    // a long gown turns its tiny creases into large rectangular patches.
    const sx=54+Math.floor((x-left)/(right-left)*31), sy=125+((y-top)%19);
    const s=(sy*W+sx)*4,r=source.data[s],g=source.data[s+1],b=source.data[s+2];
    if(!source.data[s+3]||r>g+3)continue;
    const lum=.2126*r+.7152*g+.0722*b, bright=lum>164;
    const amount=Math.min(.20,Math.abs(lum-164)/95*(bright?.14:.22));
    const colour=rgb(bright?t.shine:t.ink), p=(y*W+x)*4;
    for(let n=0;n<3;n++)data[p+n]=colour[n];data[p+3]=Math.round(amount*255);
  }
  const runs=trace({data,info:{width:W,height:H}},c=>c);
  const outlines=[...markup.matchAll(/<path d="([^"]+)"/g)];
  const clip=outlines[1]?.[1]||outlines[0][1];
  return `<defs><clipPath id="skirt-interior">${p(clip,'#ffffff')}</clipPath></defs><g id="original-skirt-luminance-folds" clip-path="url(#skirt-interior)">${runs}</g>`;
}
function whiteFoldDefs(t) {
  const colors=t===themes.gpt?[t.shade,t.light,t.shine,t.mid,t.shine,t.shade]:t===themes.claude?['#cdb9a7','#f5e8d9','#fff8eb','#e2cdbb','#fff8eb','#ceb6a2']:['#c5c5d8','#eeedf6','#fffaff','#d8d7e7','#fffaff','#bfc0d4'];
  return `<linearGradient id="white-fold">${colors.map((color,i)=>`<stop offset="${i/5}" stop-color="${color}"/>`).join('')}</linearGradient>`;
}
const wrap=(body,label,t)=>`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="226" viewBox="0 0 140 226" shape-rendering="crispEdges"><title>${esc(label)}</title><metadata>Default standing pose; original skin pixel paths retained; editable vector garment paths.</metadata><defs>${foldDefs(t)}${whiteFoldDefs(t)}</defs>${body}</svg>`;

export async function buildClothes({sharp,classicRoot,outputRoot}) {
  const top=await sharp(path.join(classicRoot,'top','default.gif'),{page:0,pages:1}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const bottom=await sharp(path.join(classicRoot,'bottom','default.gif'),{page:0,pages:1}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const results={};
  for(const [id,t] of Object.entries(themes)) {
    const fabric=[t.ink,t.shade,t.mid,t.light,t.shine];
    const baseTop=trace(top,(c,x,y)=>{
      const cloth=c[2]>c[0]+1 || (x>=59&&x<=79&&y>=96&&y<=122&&Math.max(...c)-Math.min(...c)<8);
      if(!cloth)return c;
      // The cropped Gemini bodice reveals the same torso silhouette. Its skin
      // tones come from default's leg pixels at y150/155, rather than retaining
      // a recolored vest underneath the open midriff.
      if(id==='gemini')return shade(c,['#df9045','#fdc68f','#fbdabb','#fde7cf'],115,255);
      if(id==='qwen'||id==='glm')return shade(c,['#9996b0','#c8c5d7','#e8e5f0','#fffaff'],115,255);
      const palette=id==='claude'?[t.ink,'#c9ad84','#efddbd',t.shine,'#ffffff']:fabric;
      return shade(c,palette,115,255);
    });
    const legPixels=trace(bottom,(c,x,y)=>{
      if(id==='grok') return shade(c,y>=188?[t.ink,t.dark,t.shade,t.mid]:['#342638','#513e50','#735869','#9c7c89'],100,255);
      if(id==='deepseek'&&y>=175) return shade(c,y>=198?[t.ink,t.shade,t.mid,t.light]:['#8f94b8','#c7d3e8','#e6eff9','#ffffff'],100,255);
      if(id==='gpt'&&y>=194)return shade(c,[t.ink,t.shade,t.mid,t.shine],100,255);
      if(id==='claude'&&y>=189)return shade(c,['#5f4234','#a8784a','#e3bc87','#fff0d0'],100,255);
      if(id==='qwen'&&y>=199)return shade(c,[t.ink,t.shade,t.mid,t.light],100,255);
      if(id==='gemini'&&y>=179)return shade(c,y>=201?[t.ink,t.shade,t.mid,t.light]:['#a5a0bd','#c9c3d8','#e7e2f0','#fff8ff'],100,255);
      if(id==='glm'&&y>=190)return shade(c,y>=204?[t.ink,t.dark,t.shade,t.mid]:['#8d8d9f','#c1bfce','#e5e3ec','#fffaff'],100,255);
      return c;
    },(_x,y)=>y>=143);
    const topSvg=wrap(`<g id="default-upper-body-pixel-paths">${baseTop}</g><g id="editable-garment-details">${topDetails(id,t)}</g>${garmentFinish(id,t,'top')}`,`${id} 上装 · default 原身体`,t);
    const skirtMarkup=skirt(id,t);
    const bottomSvg=wrap(`<g id="editable-skirt">${skirtMarkup}</g>${skirtTexture(bottom,id,t,skirtMarkup)}${garmentFinish(id,t,'bottom')}`,`${id} 裙装 · default 腰线`,t);
    const legsSvg=wrap(`<g id="default-leg-pixel-paths">${legPixels}</g><g id="editable-shoe-details">${shoeDetails(id,t)}</g>${garmentFinish(id,t,'legs')}`,`${id} 鞋袜 · default 原双腿`,t);
    const directory=path.join(outputRoot,id);await fs.mkdir(directory,{recursive:true});
    for(const [name,svg] of [['top',topSvg],['bottom',bottomSvg],['legs',legsSvg]])await fs.writeFile(path.join(directory,`${name}.svg`),svg,'utf8');
    results[id]={top:topSvg,bottom:bottomSvg,legs:legsSvg,references:['top/default.gif','bottom/default.gif','top/学生白衫.gif','bottom/粉色百褶短裙.gif','bottom/黑曜长靴短裙.gif','bottom/落日蛋糕短裙.gif'],finish:'Native 1px fabric rows, restrained collar/cuff/hem needlework, narrow satin glints and tiny metal highlights; default body and garment silhouettes retained.'};
  }
  return results;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const require=createRequire(path.join(root,'tools','.deps','package.json'));
  const sharp=require('sharp');
  await buildClothes({sharp,classicRoot:path.resolve(root,'..','qq-show-classic'),outputRoot:path.join(root,'public','assets-classic')});
  console.log(`Wrote ${Object.keys(themes).length*3} editable clothing SVG layers on the original default standing coordinates.`);
}
