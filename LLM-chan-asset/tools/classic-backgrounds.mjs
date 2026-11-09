import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const ARTIST='https://www.bilibili.com/opus/1233069202138464289';
const FANWORK_PROMPTS='https://raw.githubusercontent.com/Apprentice-Geo/AI-Fanworks/ee1f5176710f3bcfd60ee5cb0af00f77ed96748e/ApprenTice/AI-Girls-and-Chibis/Prompts.md';
const MODEL_CHARACTERS='https://raw.githubusercontent.com/Neko3000/deepseek-whalechan/main/skills/whalechan-image-comic/references/model-characters.json';

// Project-created environments inspired by each character; these are not
// locations asserted to be canonical settings of the original character artist.
export const BACKGROUND_DESIGNS = {
  gpt: {
    name:'云端星图书阁', displayName:'GPT',
    theme:'月白龙娘的云端书阁，以星图、浮云与银紫色光线承托人物。',
    palette:['#d7cfea','#eee7f5','#b9aacd','#f7f1e8'],
    source:'source-art/backgrounds/gpt-source.png',
    researchSources:[{kind:'original-artist-showcase',url:ARTIST},{kind:'fanwork-visual-directions',url:FANWORK_PROMPTS}],
    localStyleReferences:['qq-show-classic/backgrounds/星座云台.gif'],
  },
  deepseek: {
    name:'海边白饭食堂', displayName:'DeepSeek',
    theme:'爱吃白饭的大肥鱼的海边食堂，米饭与蒸汽布置在人物两侧。',
    palette:['#e6d9bb','#a7cad4','#5b81a4','#f5efdb'],
    source:'source-art/backgrounds/deepseek-source.png',
    researchSources:[{kind:'fanwork-persona',url:'https://raw.githubusercontent.com/Neko3000/deepseek-whalechan/main/skills/whalechan-image-comic/references/character-personality.md'},{kind:'fanwork-character-record',url:MODEL_CHARACTERS}],
    localStyleReferences:['qq-show-classic/backgrounds/海底世界.gif'],
  },
  claude: {
    name:'庄园午后书房', displayName:'Claude',
    theme:'温婉大小姐的安静庄园书房，柔和日光、茶具与藏书保留舒缓氛围。',
    palette:['#dfd3ba','#b7baaa','#96755f','#f1e8d4'],
    source:'source-art/backgrounds/claude-source.png',
    researchSources:[{kind:'original-artist-showcase',url:ARTIST},{kind:'fanwork-character-record',url:MODEL_CHARACTERS}],
    localStyleReferences:['qq-show-classic/backgrounds/雏菊花开.gif'],
  },
  grok: {
    name:'黑金夜城露台', displayName:'Grok',
    theme:'黑金哥特造型的夜城露台，以金属栏杆、夜色与玫瑰色天光衬托轮廓。',
    palette:['#55485c','#b59475','#b78393','#e0bfb4'],
    source:'source-art/backgrounds/grok-source.png',
    researchSources:[{kind:'fanwork-visual-directions',url:FANWORK_PROMPTS},{kind:'official-product-creative-context',url:'https://x.ai/news/grok'}],
    localStyleReferences:['qq-show-classic/backgrounds/万圣城堡.gif'],
  },
  qwen: {
    name:'江南云锦书斋', displayName:'千问',
    theme:'蓝紫中式衣裙与折扇对应的江南书斋，窗棂、竹影与卷轴围绕中心留白。',
    palette:['#d9dfc9','#a2b5a2','#b3a2ca','#eadcc4'],
    source:'source-art/backgrounds/qwen-source.png',
    researchSources:[{kind:'original-artist-showcase',url:ARTIST},{kind:'fanwork-visual-directions',url:FANWORK_PROMPTS}],
    localStyleReferences:['qq-show-classic/backgrounds/中式楼阁.gif'],
  },
  gemini: {
    name:'双子星观测台', displayName:'Gemini',
    theme:'异色瞳猫娘的双子星观测台，青蓝星空、虹彩星芒与观测器材分置侧边。',
    palette:['#5d7c92','#9fbdd4','#d2a5d8','#e4c98d'],
    source:'source-art/backgrounds/gemini-source.png',
    researchSources:[{kind:'official-name-origin',url:'https://blog.google/innovation-and-ai/products/google-gemini-ai-name-meaning/'},{kind:'fanwork-visual-directions',url:FANWORK_PROMPTS}],
    localStyleReferences:['qq-show-classic/backgrounds/双子云殿.gif'],
  },
  glm: {
    name:'月夜午睡书房', displayName:'GLM',
    theme:'贪睡小狐娘的月夜午睡书房，软榻、书本与灰紫月光形成安静的休息角落。',
    palette:['#b1acc9','#84879f','#e0d7e5','#5b607c'],
    source:'source-art/backgrounds/glm-source.png',
    researchSources:[{kind:'fanwork-persona',url:'https://raw.githubusercontent.com/tzzzzzzzx/zcode-persona-modes/main/persona-modes/modes/glm_chan.md'},{kind:'fanwork-visual-observations',url:'https://raw.githubusercontent.com/tzzzzzzzx/zcode-persona-modes/main/persona-modes/assets/glm-image-prompt.md'}],
    localStyleReferences:['qq-show-classic/backgrounds/星夜花园.gif'],
  },
};

export async function buildBackgrounds({sharp,root,outputRoot,previewRoot,toPixelSvg,saveSvg}) {
  const notes={},cells=[],nativeCells=[],labels=[];
  let column=0;
  for(const [id,design]of Object.entries(BACKGROUND_DESIGNS)){
    // Missing new artwork is an error: an old scene must never silently stand
    // in for one of the seven requested remakes. Original source bytes are read-only.
    const source=await fs.readFile(path.join(root,design.source));
    const original=await sharp(source).metadata();
    const png=await sharp(source)
      .resize(140,226,{fit:'cover',position:'centre',kernel:'nearest'})
      .flatten({background:design.palette[0]})
      .png({palette:true,colours:256,dither:.1}).toBuffer();
    await saveSvg(id,'background',await toPixelSvg(png,{title:`${design.displayName} ${design.name} · original project environment · 140×226`}));
    const generated=path.join(outputRoot,id,'background.png');
    nativeCells.push({input:generated,left:column*140,top:0});
    cells.push({input:await sharp(generated).resize(280,452,{kernel:'nearest'}).png().toBuffer(),left:column*300+10,top:60});
    labels.push(`<text x="${column*300+150}" y="25" font-size="16">${design.displayName}</text><text x="${column*300+150}" y="48" font-size="13">${design.name}</text>`);
    notes[id]={
      ...design,method:'OpenAI built-in image_gen artwork adapted to native pixel paths',
      interpretation:'Project-created fanwork environment; not a claim of a canonical character location',
      promptRecord:'source-art/backgrounds/generation-prompts.json',
      originalCanvas:[original.width,original.height],sourceSha256:createHash('sha256').update(source).digest('hex'),
      canvas:[140,226],adaptation:{fit:'cover',position:'centre',kernel:'nearest',colours:256,dither:.1},
      containsCharacters:false,animation:{kind:'static'},
    };
    column++;
  }
  await fs.mkdir(previewRoot,{recursive:true});
  await sharp({create:{width:column*140,height:226,channels:4,background:'#eeeaf2'}}).composite(nativeCells).png().toFile(path.join(previewRoot,'backgrounds-only-native.png'));
  const headings=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${column*300}" height="530"><g font-family="Microsoft YaHei,sans-serif" text-anchor="middle" fill="#54465f">${labels.join('')}</g></svg>`);
  await sharp({create:{width:column*300,height:530,channels:4,background:'#eeeaf2'}}).composite([...cells,{input:headings}]).png().toFile(path.join(previewRoot,'backgrounds-only-2x.png'));
  return notes;
}
