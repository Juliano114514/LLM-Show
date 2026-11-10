export const order=['back','back-hair','body','shoes','bottom','top','face','features','front-hair','headwear','hands','prop','fingers','effect'];
export const anatomyOrder=['rear-leg','front-leg','torso','neck','left-arm','right-arm','hands'];
export const adjacency=[['body','top'],['body','bottom'],['body','shoes'],['top','hands'],['hands','prop'],['prop','fingers'],['face','front-hair'],['back-hair','front-hair'],['top','bottom'],['headwear','front-hair']];
export const AI='ai';
export const NONE='none';
export function standardMannequinLayers(character){
  // Whole body retains the author's actual internal overlap/paint sequence.
  // Hands are the bare anatomical study, not costume gloves or pose variants.
  return [{key:'body',src:character.layers.body},...['face','features'].map(key=>({key,src:character.layers[key]})),{key:'body.hands',src:character.anatomy.hands}];
}
export function nativeSelection(catalog,index=0){
  const selection={...Object.fromEntries(catalog.slots.map(slot=>[slot.id,index%slot.native.length])),...catalog.reviewSession?.contexts?.[index]?.selection};
  const target=catalog.slots.find(slot=>slot.id==='body')?.native[selection.body];
  return {...selection,__pose:target?.id||null,__targetGeometryHash:target?.geometryHash||null,__context:index};
}
export const aiSelection=catalog=>({...Object.fromEntries(catalog.slots.map(slot=>[slot.id,AI])),__pose:'standard'});
function compatiblePose(selection,character){
  const pose=character.compatibility?.poses?.[selection.__pose];
  return pose&&pose.targetGeometryHash===selection.__targetGeometryHash?pose:null;
}
export function makeCases(catalog,character){
  const cases=[];
  const round=catalog.reviewSession?.round??1;
  for(const slot of catalog.slots)for(let context=0;context<5;context++)cases.push({id:`${character.id}--r${round}--${slot.id.replaceAll('.','_')}--n${context+1}`,character:character.id,kind:'single',slot:slot.id,context,selection:{...nativeSelection(catalog,context),[slot.id]:AI,...(slot.group==='anatomy'?{'body.mode':'parts'}:{})}});
  for(const pair of adjacency)for(let context=0;context<5;context++)cases.push({id:`${character.id}--r${round}--pair-${pair.join('_')}--n${context+1}`,character:character.id,kind:'pair',slot:pair.join(' + '),context,selection:{...nativeSelection(catalog,context),...Object.fromEntries(pair.map(id=>[id,AI]))}});
  for(const group of catalog.reviewSession?.aiGroups||[])for(let context=0;context<5;context++)cases.push({id:`${character.id}--r${round}--${group.id}--n${context+1}`,character:character.id,kind:'multi',slot:group.id,aiSlots:group.slots,context,selection:{...nativeSelection(catalog,context),...Object.fromEntries(group.slots.map(id=>[id,AI])),...(group.anatomyMode?{'body.mode':'parts'}:{})}});
  cases.push({id:`${character.id}--r${round}--all-ai`,character:character.id,kind:'all-ai',slot:'all',context:0,selection:aiSelection(catalog)});
  return cases;
}
export function sourceOf(slot,selection,character){
  const index=selection[slot.id]??0;
  if(index===NONE)return {src:null,label:'不佩戴',ai:false,omitted:true};
  if(index===AI){
    const pose=compatiblePose(selection,character),group=slot.group==='anatomy'?'anatomy':'layers',key=slot.group==='anatomy'?slot.id.slice(5):slot.id;
    const variant=pose?.[group]?.[key],standard=group==='anatomy'?character.anatomy?.[key]:character.layers?.[key];
    return {src:character.ready?(variant||standard):null,label:character.name+' / '+slot.label,ai:true,poseVariant:variant?selection.__pose:'standard',targetGeometryHash:variant?pose.targetGeometryHash:null};
  }
  return {...slot.native[index],ai:false};
}
export function visualLayers(catalog,selection,character){
  const byId=Object.fromEntries(catalog.slots.map(slot=>[slot.id,slot])),result=[];
  const pose=compatiblePose(selection,character);
  const bodyChoice=selection.body!==AI?byId.body?.native[selection.body??0]:(pose?.layers?.body?byId.body.native.find(option=>option.id===selection.__pose):null);
  for(const key of order){
    if(key==='body'&&(selection['body.mode']==='parts'||catalog.slots.some(slot=>slot.group==='anatomy'&&selection[slot.id]===AI))&&selection.body!==AI){
      for(const part of anatomyOrder){const slot=byId['body.'+part];if(slot){const entry=sourceOf(slot,selection,character);if(entry?.src)result.push({...entry,key:slot.id});}}
    }else{const slot=byId[key];if(slot){const entry=sourceOf(slot,selection,character);
      if(key==='shoes'&&!entry.ai&&bodyChoice?.shoeOffsets&&entry.physicalParts?.length){
        for(const physical of entry.physicalParts){const offsets=bodyChoice.shoeOffsets[physical.side];if(!offsets)continue;const [x,y,angle]=offsets;result.push({...entry,src:physical.src,key:key+'-'+physical.side,transform:`translate(${x} ${y}) rotate(${angle} 0 0)`,poseBinding:{footType:bodyChoice.footType,side:physical.side,offsets,verifiedSvgRegistration:'stage origin; overlaid against official foot poses 1,5,6'}});}
      }else if(entry?.src)result.push({...entry,key});
    }}
  }
  return result;
}
export function selectionKey(selection){return Object.entries(selection).sort(([a],[b])=>a.localeCompare(b)).map(([id,n])=>id+':'+n).join('|');}
export function nativeBaseline(catalog,selection,context){
  const reference=nativeSelection(catalog,context),baseline={...selection};
  for(const slot of catalog.slots)if(baseline[slot.id]===AI)baseline[slot.id]=reference[slot.id];
  if(selection.body===AI){
    const target=catalog.slots.find(slot=>slot.id==='body')?.native.findIndex(option=>option.id===selection.__pose&&option.geometryHash===selection.__targetGeometryHash);
    if(target>=0)baseline.body=target;
  }
  if(selection.body!==AI&&(selection['body.mode']==='parts'||catalog.slots.some(slot=>slot.group==='anatomy'&&selection[slot.id]===AI)))baseline['body.mode']='parts';
  return baseline;
}
