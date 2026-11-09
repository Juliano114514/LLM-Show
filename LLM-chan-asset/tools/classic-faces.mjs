import fs from 'node:fs/promises';
import path from 'node:path';

// Iris hues follow the normal-proportion artwork. User-specified personalities
// take precedence over the local fanwork persona drafts.
export const FACE_PROFILES = {
  gpt: { name:'淡紫温和微笑', mood:'自然舒眉、淡灰紫瞳、柔和小笑', brow:'#91859e', iris:['#6c657f','#ada7c8','#d1cde4'], mouth:'#b27483' },
  deepseek: { name:'蓝瞳馋饭鼓腮', mood:'爱吃白饭的大肥鱼：圆亮蓝紫渐水蓝眼、满足鼓腮、嘴角一粒白饭', brow:'#58688c', iris:['#43456f','#6989b6','#a4d4e3'], mouth:'#b5777c', directionSource:'用户指定：爱吃白饭的大肥鱼' },
  claude: { name:'茶金舒缓静容', mood:'家教很严的温婉大小姐：茶金杏眼、舒缓眉眼、嘴角收平的自然闭口', brow:'#af927a', iris:['#75575b','#aa876e','#dec7aa'], mouth:'#ba9991', directionSource:'用户指定：温婉大小姐，神态舒缓，减弱微笑' },
  grok: { name:'碧蓝自信浅笑', mood:'明亮蓝瞳、轻挑眉、自信小笑', brow:'#94734e', iris:['#31518c','#6093d7','#9bc9ef'], mouth:'#ad7284' },
  qwen: { name:'紫瞳端庄浅笑', mood:'细弧眉、浅紫瞳、端庄收口笑', brow:'#747aa0', iris:['#605a8c','#9487c4','#c7bde8'], mouth:'#b27f8b' },
  gemini: { name:'玫金灵动猫笑', mood:'自然轻扬眉、玫金异色瞳、轻快小猫笑', brow:'#8270a3', iris:['#8a3e67','#c65e97','#ec9ac4'], rightIris:['#987145','#d0a652','#f0d695'], mouth:'#b77995' },
  glm: { name:'灰紫困倦闭口', mood:'犯困的贪睡虫：半睁灰紫瞳、松弛眉、自然闭口的困意', brow:'#72717f', iris:['#666171','#9b96a7','#cbc6d3'], mouth:'#ae949f', directionSource:'用户指定：保留困意，去掉哈欠' },
};

const pixels=(points,color,opacity=1)=>`<path fill="${color}"${opacity<1?` fill-opacity="${opacity}"`:''} d="${points.map(([x,y])=>`M${x} ${y}h1v1h-1z`).join('')}"/>`;
const mirror=points=>points.map(([x,y])=>[138-x,y]);
const rect=(x,y,w,h,color,opacity=1)=>`<path fill="${color}"${opacity<1?` fill-opacity="${opacity}"`:''} d="M${x} ${y}h${w}v${h}h-${w}z"/>`;

function brows(id,p) {
  const shapes={
    gpt:[[58,66],[59,65],[60,65],[61,65],[62,65],[63,66]],
    deepseek:[[58,66],[59,65],[60,65],[61,65],[62,65],[63,66]],
    claude:[[59,66],[60,65],[61,65],[62,65],[63,66]],
    grok:[[58,66],[59,65],[60,65],[61,65],[62,66],[63,66]],
    qwen:[[58,66],[59,65],[60,65],[61,65],[62,65],[63,66]],
    gemini:[[58,66],[59,65],[60,65],[61,65],[62,66],[63,66]],
    glm:[[58,67],[59,67],[60,67],[61,67],[62,68],[63,68]],
  };
  const right=id==='grok'?[[75,65],[76,64],[77,64],[78,64],[79,65],[80,66]]:mirror(shapes[id]);
  return `<g id="character-eyebrows">${pixels([...shapes[id],...right],p.brow,id==='claude'?.65:.85)}</g>`;
}

function irises(id,p) {
  // Each eye is a complete native-pixel shape with one connected iris, one
  // central pupil and a highlight in the same upper-left direction.
  const round=['...LLL...','.LdddddL.','LwdHPddwL','lwmmPmmwl','.WmbbbmW.','..LbbbL..','...sss...','.........'];
  const almond=['.........','..lLLLl..','.LdddddL.','lwdHPddwl','.wmmPmmw.','..lbbbl..','...sss...','.........'];
  const neutral=['...LLL...','.LdddddL.','LwdHPddwL','.wmmPmmw.','..lbbbl..','...sss...','.........','.........'];
  const sleepy=['.........','.........','.sssssss.','llLLLLLll','.LdddddL.','..mHPdm..','...lml...','.........'];
  const shape=id==='deepseek'||id==='gemini'?round:id==='claude'?almond:id==='glm'?sleepy:neutral;
  const draw=(left,tones)=>{
    const palette={L:id==='claude'?'#58434d':id==='deepseek'?'#302331':'#3f2e3c',l:'#806471',w:'#fff8f4',W:'#d5cbd8',d:tones[0],m:tones[1],b:tones[2],P:id==='claude'?'#433245':id==='glm'?'#403a4a':'#251c2c',H:id==='claude'?'#f4e7df':'#fffdfa',s:'#aa8691'};
    const groups=new Map();
    shape.forEach((row,y)=>[...row].forEach((key,x)=>{
      if(key==='.')return;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push([left+x,68+y]);
    }));
    return [...groups].map(([key,points])=>pixels(points,palette[key],key==='l'?.8:key==='s'?.45:1)).join('');
  };
  let markup=draw(57,p.iris)+draw(73,p.rightIris||p.iris);
  if(id==='grok')markup+=pixels([[56,69],[82,69]],'#806077',.7);
  return `<g id="character-iris-and-lids">${markup}</g>`;
}

function lips(id,p) {
  const shapes={
    gpt:[[67,79],[68,80],[69,80],[70,80],[71,79]],
    deepseek:[[66,79],[67,80],[68,80],[69,79],[70,80],[71,80],[72,79]],
    claude:[[68,80],[69,80],[70,80]],
    grok:[[67,80],[68,80],[69,80],[70,79],[71,79]],
    qwen:[[67,80],[68,80],[69,81],[70,80],[71,80]],
    gemini:[[66,79],[67,80],[68,80],[69,79],[70,80],[71,80],[72,79]],
    glm:[[68,80],[69,80],[70,80]],
  };
  let markup=pixels(shapes[id],p.mouth);
  if(id==='glm'||id==='claude')markup+=pixels([[69,81]],'#e5b2b5',.18);
  else markup+=pixels([[68,81],[69,81],[70,81]],'#e5b2b5',.4);
  if(id==='deepseek')markup+=pixels([[74,79],[75,79],[74,80]],'#fffcf1')+pixels([[75,80]],'#d6cbbb',.7)+rect(56,77,4,2,'#e7a09f',.13)+rect(79,77,4,2,'#e7a09f',.13);
  const blush={gpt:.10,deepseek:.16,claude:.06,grok:.08,qwen:.10,gemini:.15,glm:.06}[id];
  markup+=rect(56,77,3,1,'#e69b9a',blush)+rect(80,77,3,1,'#e69b9a',blush);
  return `<g id="character-mouth-and-blush">${markup}</g>`;
}

function eraseFeatures(data,source,width) {
  const at=(x,y)=>((y*width+x)*4);
  // Interpolate only inside opaque facial features. The original skin edge,
  // alpha, ears, chin and nose remain byte-for-byte in the PNG.
  const skin=(x,y)=>{
    const t=Math.max(0,Math.min(1,(y-60)/17)),upper=at(x,60),lower=at(x,77);
    return [0,1,2].map(c=>Math.round(source[upper+c]*(1-t)+source[lower+c]*t));
  };
  const fill=(x,y,c)=>{const n=at(x,y);if(source[n+3]===255)for(let k=0;k<3;k++)data[n+k]=c[k];};
  for(const [left,right]of [[56,66],[72,82]])for(let y=62;y<=76;y++)for(let x=left;x<=right;x++)fill(x,y,skin(x,y));
  for(let y=79;y<=82;y++)for(let x=65;x<=74;x++){
    const l=at(64,y),r=at(75,y),t=(x-64)/11;
    fill(x,y,[0,1,2].map(c=>Math.round(source[l+c]*(1-t)+source[r+c]*t)));
  }
}

export async function buildFaces({sharp,outputRoot,saveSvg,toPixelSvg}) {
  const original=await sharp(path.join(outputRoot,'base/face.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const notes={};
  for(const [id,p]of Object.entries(FACE_PROFILES)){
    const data=Buffer.from(original.data);
    eraseFeatures(data,original.data,original.info.width);
    const neutral=await sharp(data,{raw:original.info}).png().toBuffer();
    const features=brows(id,p)+irises(id,p)+lips(id,p);
    const overlay=`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="226" shape-rendering="crispEdges">${features}</svg>`;
    const layer=await sharp(Buffer.from(overlay)).ensureAlpha().raw().toBuffer();
    for(let n=0;n<data.length;n+=4)if(layer[n+3]&&original.data[n+3]===255){
      const a=layer[n+3]/255;
      for(let c=0;c<3;c++)data[n+c]=Math.round(data[n+c]*(1-a)+layer[n+c]*a);
    }
    const png=await sharp(data,{raw:original.info}).png().toBuffer();
    const baseSvg=await toPixelSvg(neutral,{title:`${id} ${p.name} · default-standing-v1`});
    const design=baseSvg.replace('</svg>',`${features}</svg>`);
    await fs.mkdir(path.join(outputRoot,id),{recursive:true});
    await fs.writeFile(path.join(outputRoot,id,'face-design.svg'),design);
    await saveSvg(id,'face',await toPixelSvg(png,{title:`${id} ${p.name} · default-standing-v1`}));
    // Keep the exact original alpha at the translucent face boundary.
    await fs.writeFile(path.join(outputRoot,id,'face.png'),png);
    let changed=0,alphaChanges=0,outsideFeatures=0;
    for(let y=0;y<226;y++)for(let x=0;x<140;x++){
      const n=(y*140+x)*4;
      if(data[n+3]!==original.data[n+3])alphaChanges++;
      if(data.subarray(n,n+4).some((v,c)=>v!==original.data[n+c])){
        changed++;
        if(x<56||x>82||y<62||y>83)outsideFeatures++;
      }
    }
    notes[id]={name:p.name,mood:p.mood,personaSource:p.directionSource||`ai-girls-atlas/encyclopedia/personas/${id}.md`,irisReference:'ZipZipPipe normal-proportion character artwork',eyeStrategy:'Connected 5-pixel-wide iris, central pupil and one upper-left highlight; old eye features fully replaced.',interpretation:'Project fanwork interpretation following user direction',changedPixels:changed,alphaChanges,outsideFeatureRegion:outsideFeatures};
  }
  return notes;
}

export async function renderExpressionPreview({sharp,outputRoot,previewRoot,characters,referenceRoot}) {
  const width=characters.length*180, cells=[],headers=[];
  for(let n=0;n<characters.length;n++){
    const c=characters[n],left=n*180,p=FACE_PROFILES[c.id];
    let before=path.join(previewRoot,'expression-revision-before',c.id,'face.png'),beforeLabel='上一版';
    try{await fs.access(before);}catch(error){
      if(error.code!=='ENOENT')throw error;
      before=path.join(previewRoot,'expression-before',c.id,'face.png');beforeLabel='原表情';
      try{await fs.access(before);}catch(error){if(error.code!=='ENOENT')throw error;before=path.join(outputRoot,'base/face.png');beforeLabel='原版底板';}
    }
    for(const [name,file,top]of [
      [beforeLabel,before,68],
      ['特化表情',path.join(outputRoot,c.id,'face.png'),238],
    ]){
      cells.push({input:await sharp(file).extract({left:49,top:49,width:41,height:39}).resize(123,117,{kernel:'nearest'}).png().toBuffer(),left:left+28,top});
      headers.push(`<text x="${left+90}" y="${top-10}" text-anchor="middle">${name}</text>`);
    }
    cells.push({input:await sharp(path.join(outputRoot,c.id,'preview.png')).extract({left:35,top:25,width:70,height:73}).resize(140,146,{kernel:'nearest'}).png().toBuffer(),left:left+20,top:400});
    headers.push(`<text x="${left+90}" y="25" text-anchor="middle" font-size="16">${c.name}</text><text x="${left+90}" y="385" text-anchor="middle">${p.name}</text>`);
  }
  const labels=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="570"><g font-family="Microsoft YaHei,sans-serif" font-size="12" fill="#54465f">${headers.join('')}</g></svg>`);
  for(const [theme,color]of [['light','#eeeaf2'],['dark','#292635']]){
    const text=theme==='dark'?Buffer.from(labels.toString().replace('#54465f','#e8dfef')):labels;
    await sharp({create:{width,height:570,channels:4,background:color}}).composite([...cells,{input:text}]).png().toFile(path.join(previewRoot,`seven-expressions-${theme}.png`));
  }
  const headLabels=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="236"><g font-family="Microsoft YaHei,sans-serif" text-anchor="middle" fill="#54465f">${characters.map((c,n)=>`<text x="${n*180+90}" y="25" font-size="16">${c.name}</text><text x="${n*180+90}" y="50" font-size="12">${FACE_PROFILES[c.id].name}</text>`).join('')}</g></svg>`);
  await sharp({create:{width,height:236,channels:4,background:'#eeeaf2'}}).composite([...cells.filter(c=>c.top===400).map(c=>({...c,top:70})),{input:headLabels}]).png().toFile(path.join(previewRoot,'seven-expression-heads.png'));
  const focus=[['deepseek','爱吃白饭的大肥鱼','蓝紫 → 浅水蓝瞳','p00'],['claude','家教很严的温婉大小姐','低饱和茶金瞳','p02'],['glm','犯困的贪睡虫','冷灰紫瞳','p06']];
  const focusCells=[],comparisonCells=[],focusLabels=[],comparisonLabels=[];
  for(let n=0;n<focus.length;n++){
    const [id,personality,color,page]=focus[n],c=characters.find(c=>c.id===id),left=n*300;
    const crop={left:35,top:25,width:70,height:73};
    const head=await sharp(path.join(outputRoot,id,'preview.png')).extract(crop).resize(210,219,{kernel:'nearest'}).png().toBuffer();
    focusCells.push({input:head,left:left+45,top:80});
    focusLabels.push(`<text x="${left+150}" y="28" font-size="18">${c.name}</text><text x="${left+150}" y="54" font-size="13">${FACE_PROFILES[id].name}</text><text x="${left+150}" y="337" font-size="14">${personality}</text><text x="${left+150}" y="364" font-size="12">${color}</text>`);
    comparisonLabels.push(`<text x="${left+150}" y="27" font-size="17">${c.name} · 人设图与本轮修订</text><text x="${left+150}" y="332">上一版神态</text><text x="${left+150}" y="552">本轮 · ${FACE_PROFILES[id].name}</text>`);
    comparisonCells.push({input:head,left:left+45,top:575});
    const previous=path.join(previewRoot,'expression-revision-before',id,'preview.png');
    try{
      await fs.access(previous);
      comparisonCells.push({input:await sharp(previous).extract(crop).resize(140,146,{kernel:'nearest'}).png().toBuffer(),left:left+80,top:360});
    }catch(error){if(error.code!=='ENOENT')throw error;}
    if(referenceRoot){
      const file=path.join(referenceRoot,id,`normal-zipzippipe-pixiv-148186519-${page}.jpg`),meta=await sharp(file).metadata();
      const reference=await sharp(file).extract({left:Math.floor(meta.width*.28),top:Math.floor(meta.height*.03),width:Math.floor(meta.width*.5),height:Math.floor(meta.height*.24)}).resize(210,240,{fit:'contain',background:'#fff'}).png().toBuffer();
      comparisonCells.push({input:reference,left:left+45,top:55});
    }
  }
  const focusSvgLabels=(body,height)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}"><g font-family="Microsoft YaHei,sans-serif" text-anchor="middle" font-size="13" fill="#54465f">${body.join('')}</g></svg>`);
  await sharp({create:{width:900,height:390,channels:4,background:'#eeeaf2'}}).composite([...focusCells,{input:focusSvgLabels(focusLabels,390)}]).png().toFile(path.join(previewRoot,'focus-three-expressions.png'));
  await sharp({create:{width:900,height:820,channels:4,background:'#eeeaf2'}}).composite([...comparisonCells,{input:focusSvgLabels(comparisonLabels,820)}]).png().toFile(path.join(previewRoot,'expression-revision-comparison.png'));
}
