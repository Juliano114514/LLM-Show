// Re-render hand-edited SVGs without invoking the source generators.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sharp,toPixelSvg,alphaBox} from './pixel-svg.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'public/assets-classic/manifest.json'),'utf8'));
const local=url=>path.join(root,'public',url);
const empty=()=>sharp({create:{width:140,height:226,channels:4,background:'#00000000'}});
const sources=new Map();
for(const item of manifest.items)for(const layer of item.layers||[{src:item.src,svg:item.svg}])if(layer.svg)sources.set(layer.src,layer.svg);
for(const [png,svg] of sources)await sharp(local(svg)).resize(140,226).png().toFile(local(png));
for(const item of manifest.items.filter(i=>i.layers)){
  const png=await empty().composite([...item.layers].sort((a,b)=>a.z-b.z).map(l=>({input:local(l.src)}))).png().toBuffer();
  await fs.writeFile(local(item.src),png);await fs.writeFile(local(item.svg),await toPixelSvg(png));
}
async function compose(selection){
  const layers=manifest.slots.flatMap(s=>{if(s.id==='background')return[];const item=manifest.items.find(i=>i.id===selection[s.id]);return item?(item.layers||[{src:item.src,z:s.z}]):[]}).sort((a,b)=>a.z-b.z);
  return empty().composite(layers.map(l=>({input:local(l.src)}))).png().toBuffer();
}
const profiles=[{id:'base',name:'原版 default',preset:manifest.basePreset},...manifest.characters],cells=[];
for(let n=0;n<profiles.length;n++){
  const c=profiles[n],png=await compose(c.preset);
  await fs.writeFile(path.join(root,'public/assets-classic',c.id,'preview.png'),png);
  if(c.id!=='base')await sharp(png).extract({left:43,top:42,width:53,height:50}).resize(106,100,{kernel:'nearest'}).png().toFile(local(c.portrait));
  cells.push({input:await sharp(png).resize(280,452,{kernel:'nearest'}).png().toBuffer(),left:n*300+10,top:48});
}
const comparisonWidth=profiles.length*300;
const titles=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${comparisonWidth}" height="520">${profiles.map((c,n)=>`<text x="${n*300+150}" y="28" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="15" fill="#3f3550">${c.name}</text>`).join('')}</svg>`);
await sharp({create:{width:comparisonWidth,height:520,channels:4,background:'#eeeaf2'}}).composite([...cells,{input:titles}]).png().toFile(path.join(root,'public/assets-classic/default-comparison.png'));
console.log(`Re-rendered ${sources.size} editable SVG layers and refreshed previews; source generators were not run.`);
for(const item of manifest.items){const b=await alphaBox(local(item.src));if(b){const l=Math.max(0,b[0]-4),t=Math.max(0,b[1]-4);item.thumbnailCrop={left:l,top:t,width:Math.min(140,b[2]+4)-l,height:Math.min(226,b[3]+4)-t};}}
await fs.writeFile(path.join(root,'public/assets-classic/manifest.json'),JSON.stringify(manifest,null,2));
