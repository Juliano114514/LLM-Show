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
function topDetails(id,t) {
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
function skirt(id,t) {
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
  if(id==='gpt') return cuff(194,t.metal)+line('M51 201l5 1m18 0 5-1',t.metal)+gem(54,204,GPT_COLORS.gem,t)+gem(76,204,GPT_COLORS.gem,t)+sole;
  if(id==='deepseek') return cuff(178,'#eaf8ff')+line('M51 200l6 1m15 0 7-1',t.light)+rect(54,201,1,2,t.metal)+rect(74,200,1,2,t.metal)+sole;
  if(id==='claude') return cuff(189,t.mid)+line('M53 194l4 2-5 3 4 3m17-8 5 2-5 3 5 3',t.ink)+line('M52 193l4 1m18 0 4-1',t.shine)+sole;
  return cuff(188,t.metal)+line('M52 196l5 1m17 0 5-1',t.metal)+ring(54,204,t,2.5,2)+ring(76,204,t,2.5,2)+sole;
}
function mixed(a,b,amount) {const aa=rgb(a),bb=rgb(b);return `rgb(${aa.map((v,i)=>Math.round(v+(bb[i]-v)*amount)).join(',')})`;}
function foldDefs(t) {
  const steps=[.7,.54,.34,.12,0,.18,.37,.59,.82,.7];
  return `<linearGradient id="cloth" x1="0" x2=".2" spreadMethod="reflect">${steps.map((value,i)=>`<stop offset="${i/9}" stop-color="${mixed(t.light,t.shade,value)}"/>`).join('')}</linearGradient>`;
}
function skirtTexture(source,id,t,markup) {
  // Reuse only the original grey skirt's luminance structure. It is reprojected
  // into the new skirt and clipped inside its editable silhouette; no skin is copied.
  const boxes={gpt:[35,124,100,206],deepseek:[37,124,102,190],claude:[37,124,103,195],grok:[39,124,102,196]};
  const [left,top,right,bottom]=boxes[id], data=Buffer.alloc(W*H*4);
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++) {
    const sx=54+Math.floor((x-left)/(right-left)*31), sy=125+Math.floor((y-top)/(bottom-top)*19);
    const s=(sy*W+sx)*4,r=source.data[s],g=source.data[s+1],b=source.data[s+2];
    if(!source.data[s+3]||r>g+3)continue;
    const lum=.2126*r+.7152*g+.0722*b, bright=lum>164;
    const amount=Math.min(.28,Math.abs(lum-164)/95*(bright?.2:.3));
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
      const palette=id==='claude'?[t.ink,'#c9ad84','#efddbd',t.shine,'#ffffff']:fabric;
      return shade(c,palette,115,255);
    });
    const legPixels=trace(bottom,(c,x,y)=>{
      if(id==='grok') return shade(c,y>=188?[t.ink,t.dark,t.shade,t.mid]:['#342638','#513e50','#735869','#9c7c89'],100,255);
      if(id==='deepseek'&&y>=175) return shade(c,y>=198?[t.ink,t.shade,t.mid,t.light]:['#8f94b8','#c7d3e8','#e6eff9','#ffffff'],100,255);
      if(id==='gpt'&&y>=194)return shade(c,[t.ink,t.shade,t.mid,t.shine],100,255);
      if(id==='claude'&&y>=189)return shade(c,['#5f4234','#a8784a','#e3bc87','#fff0d0'],100,255);
      return c;
    },(_x,y)=>y>=143);
    const topSvg=wrap(`<g id="default-upper-body-pixel-paths">${baseTop}</g><g id="editable-garment-details">${topDetails(id,t)}</g>`,`${id} 上装 · default 原身体`,t);
    const skirtMarkup=skirt(id,t);
    const bottomSvg=wrap(`<g id="editable-skirt">${skirtMarkup}</g>${skirtTexture(bottom,id,t,skirtMarkup)}`,`${id} 裙装 · default 腰线`,t);
    const legsSvg=wrap(`<g id="default-leg-pixel-paths">${legPixels}</g><g id="editable-shoe-details">${shoeDetails(id,t)}</g>`,`${id} 鞋袜 · default 原双腿`,t);
    const directory=path.join(outputRoot,id);await fs.mkdir(directory,{recursive:true});
    for(const [name,svg] of [['top',topSvg],['bottom',bottomSvg],['legs',legsSvg]])await fs.writeFile(path.join(directory,`${name}.svg`),svg,'utf8');
    results[id]={top:topSvg,bottom:bottomSvg,legs:legsSvg,references:['top/default.gif','bottom/default.gif','top/学生白衫.gif','bottom/粉色百褶短裙.gif','bottom/黑曜长靴短裙.gif','bottom/落日蛋糕短裙.gif']};
  }
  return results;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const require=createRequire(path.join(root,'tools','.deps','package.json'));
  const sharp=require('sharp');
  await buildClothes({sharp,classicRoot:path.resolve(root,'..','qq-show-classic'),outputRoot:path.join(root,'public','assets-classic')});
  console.log('Wrote 12 editable clothing SVG layers on the original default standing coordinates.');
}
