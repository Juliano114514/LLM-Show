import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sharp, toPixelSvg, svgDocument, alphaBox } from './pixel-svg.mjs';
import {GPT_COLORS as gptColors,gptTone} from './classic-theme.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const classicRoot = path.resolve(root, '../qq-show-classic');
const outputRoot = path.join(root, 'public/assets-classic');
const previewRoot = path.join(root, 'previews/classic');
const ids = ['gpt','deepseek','claude','grok'];
const old = JSON.parse(await fs.readFile(path.join(root,'public/assets/manifest.json'),'utf8'));
const blank = () => sharp({create:{width:140,height:226,channels:4,background:'#00000000'}});
const file = (id,name,ext='png') => `/assets-classic/${id}/${name}.${ext}`;
await fs.mkdir(previewRoot,{recursive:true});
await fs.mkdir(path.join(outputRoot,'base'),{recursive:true});

async function saveSvg(id, name, svg, design = false) {
  const dir = path.join(outputRoot,id);await fs.mkdir(dir,{recursive:true});
  if(design){
    await fs.writeFile(path.join(dir,`${name}-design.svg`),svg);
    const rendered = await sharp(Buffer.from(svg)).resize(140,226).png().toBuffer();
    svg = await toPixelSvg(rendered,{title:`${id} ${name} · native 140×226 pixel paths`});
  }
  await fs.writeFile(path.join(dir,`${name}.svg`),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir,`${name}.png`));
}
const baseSources = {'hair-back':'back-hair/default.gif','hair-front':'front-hair/default.gif',face:'makeup/default.png',top:'top/default.gif'};
for(const [name,rel] of Object.entries(baseSources)) await saveSvg('base',name,await toPixelSvg(path.join(classicRoot,rel),{title:`Unchanged original ${rel}`}));
// The face has translucent edge pixels. SVG renderers quantize premultiplied
// channels at those edges, so the runtime copy retains the original PNG bytes.
// The separate SVG still expresses the exact original RGBA pixel run values.
await fs.copyFile(path.join(classicRoot,'makeup/default.png'),path.join(outputRoot,'base/face.png'));
const bottom = await sharp(path.join(classicRoot,'bottom/default.gif')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(const [name,predicate] of [['bottom',y=>y<145],['legs',y=>y>=145]]){
  const bytes = Buffer.from(bottom.data);for(let y=0;y<226;y++) if(!predicate(y)) for(let x=0;x<140;x++) bytes[(y*140+x)*4+3]=0;
  await saveSvg('base',name,await toPixelSvg(await sharp(bytes,{raw:bottom.info}).png().toBuffer(),{title:`Original default skirt/legs partition ${name}; geometry unchanged`}));
}
const baseLayers = ['hair-back','legs','bottom','top','face','hair-front'];
const basePng = await blank().composite(baseLayers.map(name=>({input:path.join(outputRoot,'base',`${name}.png`)}))).png().toBuffer();
await fs.writeFile(path.join(outputRoot,'base','preview.png'),basePng);
const originalPng = await blank().composite(['back-hair/default.gif','bottom/default.gif','top/default.gif','makeup/default.png','front-hair/default.gif'].map(rel=>({input:path.join(classicRoot,rel)}))).png().toBuffer();
const originalPixels=await sharp(originalPng).ensureAlpha().raw().toBuffer(),tracedPixels=await sharp(basePng).ensureAlpha().raw().toBuffer();
let basePixelDifferences=0;for(let n=0;n<originalPixels.length;n+=4)if(originalPixels.subarray(n,n+4).some((v,i)=>v!==tracedPixels[n+i]))basePixelDifferences++;
await fs.writeFile(path.join(previewRoot,'base-invariant.json'),JSON.stringify({canvas:[140,226],originalFiveLayerComposition:'qq-show-classic default',runtimeBasePixelDifferences:basePixelDifferences,faceStrategy:'Original PNG retained to avoid SVG alpha-premultiplication rounding; separate SVG encodes original RGBA runs.'},null,2));
if(basePixelDifferences)throw new Error(`Default SVG round-trip changed ${basePixelDifferences} pixels`);
if(process.argv.includes('--base-only')) process.exit(0);

const {buildHair} = await import('./classic-hair.mjs');
const {buildClothes} = await import('./classic-clothes.mjs');
const hairNotes = await buildHair({sharp,classicRoot,outputRoot,toPixelSvg});
const clothesNotes = await buildClothes({sharp,classicRoot,outputRoot,toPixelSvg});
// Contributors author SVGs in the original canvas; rasterization happens only
// at native resolution, once, before nearest-neighbor display in the UI.
for(const id of ids) for(const name of ['hair-back','hair-front','headwear','top','bottom','legs']){
  const svg = await fs.readFile(path.join(outputRoot,id,`${name}.svg`),'utf8');
  await sharp(Buffer.from(svg)).resize(140,226).png().toFile(path.join(outputRoot,id,`${name}.png`));
}

const colors = {gpt:[gptColors.contour,gptColors.mid],deepseek:['#305b93','#c2e5fa'],claude:['#b86c32','#ffe4af'],grok:['#70404d','#d7ab57']};
const star = (x,y,s,c) => `<path fill="${c}" d="M${x} ${y-s}h1v${s-1}h${s-1}v1h-${s-1}v${s}h-1v-${s}h-${s-1}v-1h${s-1}Z"/>`;
for(const id of ids){
  const [dark,light] = colors[id];
  await saveSvg(id,'face',await fs.readFile(path.join(outputRoot,'base/face.svg'),'utf8'));
  await fs.copyFile(path.join(outputRoot,'base/face.png'),path.join(outputRoot,id,'face.png'));
  const wing = id==='gpt'||id==='grok' ? await toPixelSvg(path.join(classicRoot,'wings/小恶魔.gif'),{mapColor:([r,g,b,a])=>{
    if(!a)return [0,0,0,0];const luminance=(r*.299+g*.587+b*.114)/255;
    if(id==='gpt')return [...gptTone(luminance),a];
    const l=luminance,lo=[48,19,35],hi=[165,68,95];
    return [...lo.map((v,i)=>Math.round(v+(hi[i]-v)*l)),a];
  },title:`${id}: original small demon wings silhouette recolored; unchanged position`}) : null;
  if(wing){
    if(id==='gpt'){
      const tail=`<defs><linearGradient id="pearl-dragon-tail" x2="1" y2=".35"><stop stop-color="${gptColors.shadow}"/><stop offset=".52" stop-color="${gptColors.pearl}"/><stop offset="1" stop-color="${gptColors.metal}"/></linearGradient></defs><g id="single-pearl-dragon-tail"><path d="M86 133Q114 142 123 166Q135 190 119 204Q108 211 91 202L85 194Q101 201 111 192Q120 182 111 165Q105 151 86 146Z" fill="url(#pearl-dragon-tail)" stroke="${gptColors.contour}"/><path d="M89 137Q112 149 119 171Q127 190 116 199Q105 205 94 200" fill="none" stroke="${gptColors.highlight}"/><path d="M109 152l5 3-2 4-5-3m8 7 6 3-3 4-5-3m6 8 6 3-3 4-5-3m3 7 5 3-4 4-4-3m-2 5 4 4-6 2-3-4m-3 3 2 4-6-1-2-4" fill="none" stroke="${gptColors.metal}" stroke-width=".7"/></g>`;
      await saveSvg(id,'back',wing.replace('</svg>',tail+'</svg>'),true);
    }else await saveSvg(id,'back',wing.replace(/(<svg[^>]*>)/,'$1<g transform="translate(22 26) scale(.68 .7)">').replace('</svg>','</g></svg>'),true);
  }
  else if(id==='deepseek') await saveSvg(id,'back',svgDocument(`<defs><linearGradient id="tail" x2="1" y2=".5"><stop stop-color="#273c70"/><stop offset=".46" stop-color="#416fa5"/><stop offset=".8" stop-color="#78b5db"/><stop offset="1" stop-color="#b5dce9"/></linearGradient></defs><path d="M84 145Q105 164 117 154Q126 146 120 133L116 124L123 122Q135 143 127 159Q115 182 96 171L84 159Z" fill="url(#tail)" stroke="#263b69"/><path d="M120 135Q108 131 107 114Q115 119 122 126Q128 117 134 111Q136 127 124 136Z" fill="#41638e" stroke="#283758"/><path d="M110 119Q113 129 121 132M132 117Q132 128 125 132M88 150Q106 170 121 155" fill="none" stroke="#8ac8df"/><path d="M121 136Q129 148 121 159Q111 170 99 165" fill="none" stroke="#b1d5e5" stroke-width=".7"/>`),true);
  else await saveSvg(id,'back',svgDocument(`<path d="M61 88L76 88L84 104L91 131L76 126L69 132L51 133L57 109Z" fill="#e7d1a5" stroke="#815035" stroke-width="1"/><path d="M62 91L57 125L67 121L72 126L80 121L84 125L76 94" fill="#fff1d1" stroke="#c58a51" stroke-width="1"/><path d="M54 128L64 124L69 129L77 123L88 129" fill="none" stroke="#b96730" stroke-width="2"/>`),true);
  const props={
    gpt:`<defs><linearGradient id="cloud-white" x2=".4" y2="1"><stop stop-color="${gptColors.highlight}"/><stop offset=".55" stop-color="${gptColors.pearl}"/><stop offset="1" stop-color="#c9dcf2"/></linearGradient></defs><path d="M108 120Q106 114 112 112Q113 107 119 110Q124 107 128 113Q134 113 132 120Q131 126 124 126L113 126Q107 127 108 120Z" fill="url(#cloud-white)" stroke="${gptColors.contour}"/><ellipse cx="116" cy="117" rx="2" ry="3" fill="#456c9f"/><ellipse cx="124" cy="116" rx="2" ry="3" fill="#456c9f"/><path d="M115 115h1v1h-1ZM123 114h1v1h-1Z" fill="#fff"/>`,
    deepseek:`<path d="M109 129Q107 120 117 120Q126 120 126 128L131 124L130 130L125 134Q113 140 109 129Z" fill="#568bbb" stroke="#254d7c"/><path d="M112 130Q118 135 125 130L125 134Q116 138 112 133Z" fill="#d7edff"/><path d="M112 124h2v2h-2Z" fill="#162c58"/><path d="M116 119L116 114L114 112M116 114L119 111" fill="none" stroke="#76bedc"/>${star(129,116,2,'#d1f4fa')}`,
    claude:`<path d="M110 118L126 115L130 141L113 144Z" fill="#4b3025" stroke="#32251e"/><path d="M113 120L124 118L127 139L116 141Z" fill="#643d29" stroke="#c49151"/><path d="M127 117L129 117L133 140L130 141Z" fill="#eddfc5" stroke="#9c754a"/><path d="M114 118L118 143" stroke="#ba8e53"/><path d="M120 125l1 3 3-1-2 3 2 2-3-1-1 4-1-4-3 1 2-3-2-2 3 1Z" fill="#d88c3d"/><path d="M127 119l3 19M129 122l2 15" stroke="#b9a482" stroke-width=".6"/><path d="M121 142l1 7 2-2 1 2-1-8" fill="#c07c35"/>`,
    grok:`<path d="M122 112V207" stroke="#392938" stroke-width="3"/><path d="M121 113V204" stroke="#d8b66c" stroke-width="1"/><path d="M120 108L114 100Q109 103 110 113Q110 119 115 122L121 115L127 122Q132 119 133 113Q134 103 128 100L123 108Z" fill="#4e293a" stroke="#b78d52"/><path d="M114 101Q111 108 113 115L116 119L121 113M123 113L127 119L130 115Q132 107 129 101" fill="none" stroke="#e4c67f"/><path d="M113 106L119 111L115 115M130 106L124 111L128 115" fill="none" stroke="#81513d"/><path d="M121 104L123 104L125 111L122 115L119 111Z" fill="#cba663" stroke="#45312d"/><path d="M121 198h3v3h-3ZM121 205l2 5 2-5" fill="#c49b58"/>`,
  };
  await saveSvg(id,'prop',svgDocument(props[id]),true);
  const aura = `<path d="M33 104A37 35 0 0 1 107 104" fill="none" stroke="${light}" stroke-width="1" stroke-dasharray="2 3"/>${star(70,68,2,light)}`;
  await saveSvg(id,'aura',svgDocument(aura),true);
  const points=[[17,36],[119,59],[22,151],[117,171],[30,207],[111,213]];
  await saveSvg(id,'effect',svgDocument(points.map(([x,y],n)=>star(x,y,n%2?2:3,n%2?dark:light)).join('')),true);
  // Backgrounds are exact original first frames. Their SVG source is also a
  // genuine colored-path trace, so an exported look never embeds a bitmap.
  const bg = path.join(root,'public/assets',id,'background.png');
  await saveSvg(id,'background',await toPixelSvg(bg,{title:`Original classic background ${id}, first frame`}));
}

const crop = {hair:{left:30,top:34,width:80,height:120},face:{left:45,top:46,width:50,height:45},top:{left:25,top:82,width:90,height:57},bottom:{left:35,top:117,width:70,height:52},legs:{left:40,top:148,width:55,height:70},headwear:{left:35,top:28,width:70,height:52},prop:{left:100,top:97,width:37,height:116}};
const manifest = {...old,version:2,poseFamily:'default-standing-v1',artwork:'Editable SVG built directly on classic default pixels',characters:old.characters.map(c=>({...c,portrait:file(c.id,'portrait'),preview:file(c.id,'preview')})),slots:old.slots.map(s=>({...s,thumbnailCrop:crop[s.id]||s.thumbnailCrop})),items:old.items.map(i=>({...i,src:file(i.characterId,i.slot),svg:file(i.characterId,i.slot,'svg'),description:`${i.name} · 原版 default 站姿 · 140×226 · 可编辑 SVG`,layers:i.slot==='hair'?[{src:file(i.characterId,'hair-back'),svg:file(i.characterId,'hair-back','svg'),z:20},{src:file(i.characterId,'hair-front'),svg:file(i.characterId,'hair-front','svg'),z:80}]:undefined}))};
for(const item of manifest.items)item.poseFamily='default-standing-v1';
for(const [id,name]of Object.entries({'gpt-top':'月白银链垂袖礼衣','gpt-bottom':'银链开衩长裙','gpt-prop':'云朵伙伴','claude-prop':'橘花金边书','deepseek-hair':'深海渐蓝长卷发'})){const item=manifest.items.find(i=>i.id===id);item.name=name;item.description=`${name} · 原版 default 站姿 · 140×226 · 可编辑 SVG`;}
manifest.basePreset=Object.fromEntries(manifest.slots.map(s=>[s.id,['hair','face','top','bottom','legs'].includes(s.id)?`base-${s.id}`:null]));
for(const slot of ['hair','face','top','bottom','legs'])manifest.items.push({id:`base-${slot}`,name:`原版 default ${manifest.slots.find(s=>s.id===slot).label}`,slot,characterId:'base',sourceLabel:'原版 default',src:file('base',slot),svg:file('base',slot,'svg'),description:'原始 default 像素与坐标；用于直接比较与混穿',layers:slot==='hair'?[{src:file('base','hair-back'),svg:file('base','hair-back','svg'),z:20},{src:file('base','hair-front'),svg:file('base','hair-front','svg'),z:80}]:undefined});
for(const item of manifest.items)item.poseFamily='default-standing-v1';
await blank().composite([{input:path.join(outputRoot,'base/hair-back.png')},{input:path.join(outputRoot,'base/hair-front.png')}]).png().toFile(path.join(outputRoot,'base/hair.png'));
await saveSvg('base','hair',await toPixelSvg(path.join(outputRoot,'base/hair.png')));
const report={poseFamily:manifest.poseFamily,canvas:manifest.canvas,baseSources,faceUnchanged:true,hairNotes,clothesNotes,files:[]};
const compositePreset=async(selection,background=true)=>{
  const layers=manifest.slots.flatMap(s=>{if(!background&&s.id==='background')return[];const item=manifest.items.find(i=>i.id===selection[s.id]);return item?(item.layers||[{src:item.src,z:s.z}]):[]}).sort((a,b)=>a.z-b.z);
  return blank().composite(layers.map(l=>({input:path.join(root,'public',l.src)}))).png().toBuffer();
};
for(const c of manifest.characters){
  const transparent=await compositePreset(c.preset,false),scene=await compositePreset(c.preset);
  await fs.writeFile(path.join(outputRoot,c.id,'preview.png'),transparent);
  await blank().composite([{input:path.join(outputRoot,c.id,'hair-back.png')},{input:path.join(outputRoot,c.id,'hair-front.png')}]).png().toFile(path.join(outputRoot,c.id,'hair.png'));
  await saveSvg(c.id,'hair',await toPixelSvg(path.join(outputRoot,c.id,'hair.png')));
  await sharp(transparent).extract({left:43,top:42,width:53,height:50}).resize(106,100,{kernel:'nearest'}).png().toFile(path.join(outputRoot,c.id,'portrait.png'));
  for(const [name,input] of [['transparent',transparent],['scene',scene]])await sharp(input).resize(420,678,{kernel:'nearest'}).png().toFile(path.join(previewRoot,`${c.id}-${name}-3x.png`));
}
// Preview crops are presentation metadata only. Wearable canvases and their
// original positioning stay untouched, including long skirts and small props.
for(const item of manifest.items){const b=await alphaBox(path.join(root,'public',item.src));if(b){const l=Math.max(0,b[0]-4),t=Math.max(0,b[1]-4);item.thumbnailCrop={left:l,top:t,width:Math.min(140,b[2]+4)-l,height:Math.min(226,b[3]+4)-t};}}
await fs.writeFile(path.join(outputRoot,'manifest.json'),JSON.stringify(manifest,null,2));
const selections=[manifest.basePreset,...manifest.characters.map(c=>c.preset)];
const labels=['原版 default',...manifest.characters.map(c=>c.name)];
for(const scene of [false,true]){
  const cells=[];for(let n=0;n<selections.length;n++){
    const input=await compositePreset(selections[n],scene),left=n*300+10;
    cells.push({input:await sharp(input).resize(280,452,{kernel:'nearest'}).png().toBuffer(),left,top:48});
  }
  const titles=Buffer.from(`<svg width="1500" height="520" xmlns="http://www.w3.org/2000/svg">${labels.map((s,n)=>`<text x="${n*300+150}" y="28" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="15" fill="#3f3550">${s}</text>`).join('')}</svg>`);
  await sharp({create:{width:1500,height:520,channels:4,background:scene?'#ede8ef':'#eeeaf2'}}).composite([...cells,{input:titles}]).png().toFile(path.join(previewRoot,`default-and-four-${scene?'scenes':'plain'}.png`));
}
await fs.copyFile(path.join(previewRoot,'default-and-four-plain.png'),path.join(outputRoot,'default-comparison.png'));
const standardRefs={gpt:'gpt/normal-zipzippipe-pixiv-148186519-p03.jpg',deepseek:'deepseek/normal-zipzippipe-pixiv-148186519-p00.jpg',claude:'claude/normal-zipzippipe-pixiv-148186519-p02.jpg',grok:'grok/normal-zipzippipe-pixiv-148186519-p07.jpg'};
const referenceCells=[];
for(let n=0;n<manifest.characters.length;n++){
  const c=manifest.characters[n],source=path.resolve(root,'../ai-girls-atlas/assets/zipzippipe',standardRefs[c.id]);
  referenceCells.push({input:await sharp(source).resize(280,340,{fit:'contain',background:'#fff'}).png().toBuffer(),left:n*300+10,top:44});
  referenceCells.push({input:await sharp(await compositePreset(c.preset,false)).resize(280,452,{kernel:'nearest'}).png().toBuffer(),left:n*300+10,top:432});
}
const referenceLabels=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="910">${manifest.characters.map((c,n)=>`<text x="${n*300+150}" y="27" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="15" fill="#3f3550">${c.name} · 标准立绘</text><text x="${n*300+150}" y="416" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="13" fill="#645774">default 底板 · QQ 秀适配</text>`).join('')}</svg>`);
await sharp({create:{width:1200,height:910,channels:4,background:'#eeeaf2'}}).composite([...referenceCells,{input:referenceLabels}]).png().toFile(path.join(previewRoot,'standard-reference-comparison.png'));
report.standardReferences=Object.fromEntries(Object.entries(standardRefs).map(([id,rel])=>[id,`ai-girls-atlas/assets/zipzippipe/${rel}`]));
report.gptSharedPalette=gptColors;
// Real old/new mixing, using each of the core default parts in turn.
const mixed=[];
for(let n=0;n<4;n++){
  const selection={...manifest.characters[n].preset,hair:`${ids[(n+1)%4]}-hair`,top:n%2?'base-top':`${ids[(n+2)%4]}-top`,bottom:n%2?`${ids[(n+3)%4]}-bottom`:'base-bottom',face:'base-face',headwear:null};
  mixed.push({input:await sharp(await compositePreset(selection,false)).resize(280,452,{kernel:'nearest'}).png().toBuffer(),left:n*300+10,top:20});
}
await sharp({create:{width:1200,height:490,channels:4,background:'#eeeaf2'}}).composite(mixed).png().toFile(path.join(previewRoot,'default-mixed.png'));
for(const id of ['base',...ids])for(const filename of await fs.readdir(path.join(outputRoot,id))){if(!filename.endsWith('.png'))continue;const p=path.join(outputRoot,id,filename);const m=await sharp(p).metadata();report.files.push({file:`${id}/${filename}`,width:m.width,height:m.height,alpha:m.hasAlpha,bbox:await alphaBox(p)});}
await fs.writeFile(path.join(previewRoot,'build-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({characters:4,items:manifest.items.length,poseFamily:manifest.poseFamily,output:outputRoot,preview:previewRoot}));
