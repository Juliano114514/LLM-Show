import React, {useEffect,useMemo,useState} from 'react';
import {resolveClassicLayers,NATIVE_LOWER_POLICY} from './classic-layers.mjs';
import {reviewArchive,reviewAssetUrl} from './classic-review-archive.mjs';
import {itemCompatibilityPolicies} from './classic-compatibility.mjs';
import {bodyAnatomicalGate as resolveBodyAnatomicalGate} from './classic-body-audit.mjs';
import './classic-review.css';

const params=new URLSearchParams(location.search);
const validIndex=value=>Math.max(0,Math.min(4,Number.parseInt(value,10)||0));
const REFINED_FAMILY='classic-body-first-remake-v1';
const FUSION_PASS=98,REFERENCE_PASS=90;
const BODY_PASS=98;
const hybridPresets=[
  {key:'head2',label:'头部 2 件',slots:['hair','face']},
  {key:'body3',label:'衣装体块 3 件',slots:['top','bottom','legs']},
  {key:'figure5',label:'人物 5 件',slots:['hair','face','top','bottom','legs']},
  {key:'nearFull8',label:'近全套 8 件',slots:['hair','face','headwear','top','bottom','legs','back','prop']},
  {key:'scene3',label:'场景 3 件',slots:['background','aura','effect']},
  {key:'accessories3',label:'配饰 3 件',slots:['headwear','back','prop']},
  {key:'upper2',label:'上衣接口 2 件',slots:['hair','top']},
  {key:'skirt3',label:'裙装接口 3 件',slots:['top','bottom','headwear']},
  {key:'stride2',label:'腿足接口 2 件',slots:['legs','prop']},
];
const canonicalSlots=(values,slots)=>slots.filter(slot=>values.includes(slot.id)).map(slot=>slot.id).slice(0,Math.max(1,slots.length-1));
const isApplicable=item=>Boolean(item&&item.availability!==false&&item.availability!=='not-applicable');
function roleSlots(values,manifest,characterId){
  const selected=canonicalSlots(values,manifest.slots);
  if(selected.length<2)return selected;
  const character=manifest.characters.find(c=>c.id===characterId);
  const available=selected.filter(id=>isApplicable(manifest.items.find(item=>item.id===character?.preset[id])));
  return available.length?available:selected.slice(0,1);
}
const decorSlots=['background','aura','back','headwear','prop','effect'];
const occludingDecor=['aura','back','headwear','prop','effect'];
const currentVariant=(item,id)=>item.poseVariants?.[id]||{src:item.src,svg:item.svg,layers:item.layers,z:item.z,animatedSrc:item.animatedSrc,artworkHash:item.artworkHash};
const reviewHash=(item,id)=>item?.reviewFamilyHash||item?.poseVariants?.[id]?.artworkHash||item?.artworkHash||null;
const seedDigest=value=>{
  let hash=2166136261;
  for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619)>>>0;
  return hash>>>0;
};
const newSeed=()=>`r-${Array.from(crypto.getRandomValues(new Uint32Array(2)),value=>value.toString(36)).join('-')}`;
function seededRandom(seed){
  let state=seedDigest(seed);
  return()=>{state=(state+0x6d2b79f5)>>>0;let value=state;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return((value^value>>>14)>>>0)/4294967296;};
}
export function drawNativePools(review,slots,seed,count){
  const draws=Object.fromEntries(slots.map(slot=>{
    const pool=review.items.filter(item=>item.slot===slot.id).map(item=>item.id);
    const random=seededRandom(`${seed}|${slot.id}|${review.poolHash||review.version}|native-draw-v1`);
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return[slot.id,pool.slice(0,count)];
  }));
  if(review.lowerPolicy?.id===NATIVE_LOWER_POLICY){
    const pairs=[...review.partitions];
    const random=seededRandom(`${seed}|coupled-lower|${review.poolHash}|native-draw-v2`);
    for(let i=pairs.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pairs[i],pairs[j]]=[pairs[j],pairs[i]];}
    draws.bottom=pairs.slice(0,count).map(pair=>pair.bottom);
    draws.legs=pairs.slice(0,count).map(pair=>pair.legs);
    if(review.completenessPolicy?.id==='native-complete-torso-v1'){
      const eligible=review.completenessPolicy.rows.filter(row=>row.eligible);
      const topPool=review.items.filter(item=>item.slot==='top').map(item=>item.id);
      const topRandom=seededRandom(`${seed}|complete-torso|${review.poolHash}|native-draw-v1`);
      for(let i=topPool.length-1;i>0;i--){const j=Math.floor(topRandom()*(i+1));[topPool[i],topPool[j]]=[topPool[j],topPool[i]];}
      const selected=[];
      function assign(index){
        if(index===count)return true;
        for(const top of topPool)if(!selected.includes(top)&&eligible.some(row=>row.top===top&&row.bottom===draws.bottom[index])){
          selected.push(top);if(assign(index+1))return true;selected.pop();
        }
        return false;
      }
      if(!assign(0))throw new Error('Native pool has no five distinct complete torso contexts');
      draws.top=selected;
    }
  }
  return draws;
}
function reviewedInterfaces(entry,expected){
  if(!Object.keys(expected||{}).length)return true;
  const actual=entry?.reviewedGeneratedInterfaceHashes||{};
  return JSON.stringify(Object.keys(expected).sort())===JSON.stringify(Object.keys(actual).sort())&&Object.entries(expected).every(([key,value])=>actual[key]===value);
}

function reviewedScore(entry,expectedHash,threshold,hashField='reviewedCompleteHash',context=null){
  if(!entry||!Number.isFinite(entry.score))return {text:'待独立评审',passed:false,pending:true};
  if(!expectedHash||entry[hashField]!==expectedHash)return {text:`${entry.score} · 版本待复审`,passed:false,pending:true};
  if(context&&(entry.seed!==context.seed||entry.contextSignature!==context.contextSignature))return {text:`${entry.score} · 待本轮评审`,passed:false,pending:true,historical:true};
  if(context&&!reviewedInterfaces(entry,context.generatedInterfaceHashes))return {text:`${entry.score} · 新增接口层待评审`,passed:false,pending:true};
  return {text:String(entry.score),passed:entry.score>=threshold,pending:false};
}
function sampleScore(entry,id){
  const rows=entry?.perSampleScores;
  const row=Array.isArray(rows)?rows.find(value=>value&&String(value.sampleId??value.id??value.sample).padStart(2,'0')===id):rows?.[id]??rows?.[Number(id)];
  return Number.isFinite(row)?{score:row}:row;
}
function reviewedBodyScore(entry,bodyHash,seed,corpus,signature,samples){
  if(!corpus?.ready)return {text:'样例依赖待补',passed:false,pending:true};
  const base=reviewedScore(entry,bodyHash,BODY_PASS,'reviewedBodyHash');
  if(base.pending)return base;
  if(entry.seed!==seed||entry.bodyCorpusHash!==corpus.hash||entry.corpusSignature!==signature)return {text:`${entry.score} · 待本轮素体评审`,passed:false,pending:true,historical:true};
  if(!Number.isFinite(entry.defaultComparison?.score))return {text:`${entry.score} · default 评审记录待补`,passed:false,pending:true};
  const rows=samples.map(sample=>sampleScore(entry,sample.id));
  if(rows.some(row=>!Number.isFinite(row?.score)))return {text:`${entry.score} · 逐样例记录待补`,passed:false,pending:true};
  const allSamplesPassed=entry.defaultComparison.score>=BODY_PASS&&rows.every(row=>row.score>=BODY_PASS);
  return {...base,passed:base.passed&&allSamplesPassed,text:allSamplesPassed?base.text:`${entry.score} · default 或样例未达 ${BODY_PASS}`};
}
function contextScore(entry,id,index){
  const rows=entry?.contextScores;
  const row=Array.isArray(rows)?rows.find(value=>value&&(value.caseId===id||value.id===id||value.fixtureIndex===index)):rows?.[id]??rows?.[index];
  return Number.isFinite(row)?{score:row}:row;
}
function reviewedHybridScore(entry,hashes,slots,seed,signature,cases,generatedInterfaceHashes){
  if(!entry||!Number.isFinite(entry.score))return {text:'待独立多件评审',passed:false,pending:true};
  const expectedKeys=Object.keys(hashes).sort(),receivedKeys=Object.keys(entry.reviewedPartHashes||{}).sort();
  const validHashes=JSON.stringify(expectedKeys)===JSON.stringify(receivedKeys)&&expectedKeys.every(key=>typeof hashes[key]==='string'&&hashes[key]&&entry.reviewedPartHashes[key]===hashes[key]);
  if(!validHashes||JSON.stringify([...(entry.selectedAiSlots||[])].sort())!==JSON.stringify([...slots].sort()))return {text:`${entry.score} · 多件版本待复审`,passed:false,pending:true};
  if(entry.seed!==seed||entry.contextSignature!==signature)return {text:`${entry.score} · 待本轮多件评审`,passed:false,pending:true,historical:true};
  if(!reviewedInterfaces(entry,generatedInterfaceHashes))return {text:`${entry.score} · 新增接口层待评审`,passed:false,pending:true};
  const rows=cases.map(row=>contextScore(entry,row.id,row.fixtureIndex));
  if(rows.some(row=>!Number.isFinite(row?.score)))return {text:`${entry.score} · 逐上下文记录待补`,passed:false,pending:true};
  const allPassed=rows.every(row=>row.score>=FUSION_PASS);
  return {text:allPassed?String(entry.score):`${entry.score} · 有上下文未达 ${FUSION_PASS}`,passed:entry.score>=FUSION_PASS&&allPassed,pending:false};
}

export default function ClassicReview({manifest,DollComponent:Doll}){
  const review=manifest.nativeReview;
  const [characterId,setCharacterId]=useState(()=>manifest.characters.some(c=>c.id===params.get('character'))?params.get('character'):manifest.characters[0].id);
  const [slotId,setSlotId]=useState(()=>roleSlots((params.get('aiSlots')||'').split(','),manifest,characterId)[0]||(manifest.slots.some(s=>s.id===params.get('slot'))?params.get('slot'):'hair'));
  const [aiSlots,setAiSlots]=useState(()=>{
    const selected=canonicalSlots((params.get('aiSlots')||'').split(','),manifest.slots);
    return selected.length?selected:[manifest.slots.some(s=>s.id===params.get('slot'))?params.get('slot'):'hair'];
  });
  const [arrangement,setArrangement]=useState(()=>validIndex(params.get('arrangement')));
  const [seed,setSeed]=useState(()=>params.get('seed')?.slice(0,160)||newSeed());
  const [mode,setMode]=useState(()=>['component','full','body'].includes(params.get('mode'))?params.get('mode'):'component');
  const [corpusAll,setCorpusAll]=useState(()=>params.get('corpus')==='all');
  const [scale,setScale]=useState(()=>[1,2,3].includes(Number(params.get('scale')))?Number(params.get('scale')):2);
  const [surface,setSurface]=useState(()=>params.get('surface')==='dark'?'dark':'light');
  const [animate,setAnimate]=useState(()=>params.get('animate')==='1');
  const [clearView,setClearView]=useState(()=>params.get('clear')==='1');
  const [inspectSelected,setInspectSelected]=useState(()=>params.get('inspect')==='1');
  const [hiddenNativeDecor,setHiddenNativeDecor]=useState(()=>(params.get('hide')||'').split(',').filter(id=>occludingDecor.includes(id)));
  const [scoreBook,setScoreBook]=useState(null);
  const character=manifest.characters.find(c=>c.id===characterId);
  const slot=manifest.slots.find(s=>s.id===slotId);
  const target=manifest.items.find(i=>i.id===character.preset[slotId]);
  const selectedAiSlots=useMemo(()=>roleSlots(aiSlots,manifest,characterId),[aiSlots,manifest,characterId]);
  const selectedTargets=useMemo(()=>Object.fromEntries(selectedAiSlots.map(id=>[id,manifest.items.find(item=>item.id===character.preset[id])])),[selectedAiSlots,manifest,character]);
  const selectedItemIDs=useMemo(()=>Object.fromEntries(selectedAiSlots.map(id=>[id,selectedTargets[id]?.id||null])),[selectedAiSlots,selectedTargets]);
  const partHashes=useMemo(()=>Object.fromEntries(selectedAiSlots.map(id=>[id,reviewHash(selectedTargets[id],characterId)])),[selectedAiSlots,selectedTargets,characterId]);
  const unavailableSelectedSlots=selectedAiSlots.filter(id=>!isApplicable(selectedTargets[id]));
  const roleUnavailableSlots=manifest.slots.flatMap(s=>{const item=manifest.items.find(value=>value.id===character.preset[s.id]);return isApplicable(item)?[]:[{slot:s.id,itemId:item?.id||null,name:item?.name||s.label,reason:item?.applicabilityReason||'当前角色无此部件'}];});
  const matchedPreset=hybridPresets.find(preset=>JSON.stringify(roleSlots(preset.slots,manifest,characterId))===JSON.stringify(selectedAiSlots));
  const presetExclusions=matchedPreset?roleUnavailableSlots.filter(row=>matchedPreset.slots.includes(row.slot)):[];
  const hybridKey=matchedPreset?.key||`custom:${selectedAiSlots.join('+')}`;
  const multipleAi=selectedAiSlots.length>1;
  const canClearDecor=!multipleAi||manifest.slots.some(s=>!selectedAiSlots.includes(s.id)&&!decorSlots.includes(s.id));
  const applied=manifest.poseFamily===REFINED_FAMILY;
  const completeHash=manifest.remake?.characters?.find(c=>c.id===characterId)?.completeHash;
  const partHash=reviewHash(target,characterId);
  const bodyHash=manifest.remake?.characters?.find(c=>c.id===characterId)?.bodyHash;
  const reviewCharacter=review?.characters?.[characterId];
  const bodyReady=Boolean(reviewCharacter?.body&&bodyHash&&reviewCharacter.bodyArtworkHash===bodyHash);
  const poolSizes=Object.values(review?.nativeCounts||{});
  const poolCountLabel=poolSizes.length?(Math.min(...poolSizes)===Math.max(...poolSizes)?String(poolSizes[0]):Math.min(...poolSizes)+'–'+Math.max(...poolSizes)):String(review?.nativePartsPerSlot||0);
  const contextCount=review?Math.min(review.coverage?.contextsPerDraw||5,...manifest.slots.map(s=>review.items.filter(i=>i.slot===s.id).length)):0;
  const draws=useMemo(()=>review?drawNativePools(review,manifest.slots,seed,contextCount):{},[review,manifest.slots,seed,contextCount]);
  const nativeLowerCoupled=review?.lowerPolicy?.id===NATIVE_LOWER_POLICY;
  const bodyCorpus=review?.bodyCorpus;
  const selectedCorpus=useMemo(()=>{
    const pool=[...(bodyCorpus?.samples||[])];
    if(corpusAll)return pool;
    const random=seededRandom(`${seed}|${bodyCorpus?.hash||''}|body-corpus-draw-v1`);
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return pool.slice(0,bodyCorpus?.randomSampleCount||5);
  },[bodyCorpus,seed,corpusAll]);
  const corpusSignature=useMemo(()=>`body-corpus-context-v1-${seedDigest(JSON.stringify({seed,bodyCorpusHash:bodyCorpus?.hash||null,bodyHash,mode:corpusAll?'all':'random',samples:selectedCorpus.map(({id,imageHash})=>({id,imageHash}))})).toString(16)}`,[seed,bodyCorpus?.hash,bodyHash,corpusAll,selectedCorpus]);

  useEffect(()=>{
    const controller=new AbortController();
    fetch(reviewAssetUrl('/assets-classic/native-review-scores.json'),{signal:controller.signal,cache:'no-store'})
      .then(response=>response.ok?response.json():null).then(setScoreBook)
      .catch(error=>{if(error.name!=='AbortError')setScoreBook(null);});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    const query=new URLSearchParams({review:'1',character:characterId,slot:slotId,aiSlots:selectedAiSlots.join(','),seed,arrangement:String(arrangement),mode,scale:String(scale),surface,...(animate?{animate:'1'}:{}),...(clearView&&canClearDecor?{clear:'1'}:{}),...(corpusAll?{corpus:'all'}:{}),...(inspectSelected?{inspect:'1'}:{}),...(hiddenNativeDecor.length?{hide:hiddenNativeDecor.join(',')}:{})});
    if(reviewArchive)query.set('archive',reviewArchive);
    history.replaceState(null,'',`${location.pathname}?${query}`);
    document.title=`Classic审阅 · ${character.name} · ${slot.label} · ${arrangement+1}`;
  },[characterId,slotId,selectedAiSlots,seed,arrangement,mode,scale,surface,animate,clearView,canClearDecor,corpusAll,inspectSelected,hiddenNativeDecor,character.name,slot.label]);

  const scoreCharacter=Array.isArray(scoreBook?.characters)?scoreBook.characters.find(c=>c.id===characterId):scoreBook?.characters?.[characterId];
  const acceptance=scoreCharacter?.finalAcceptance;
  const acceptanceCurrent=acceptance?.currentVersion?.bodyHash===bodyHash&&acceptance?.currentVersion?.completeHash===completeHash&&acceptance?.currentVersion?.poolHash===review?.poolHash&&acceptance?.currentVersion?.bodyCorpusHash===bodyCorpus?.hash;
  const acceptanceLabel=status=>({passed:'已通过',pending:'待评审','revision-required':'需返工'}[status]||'待评审');
  const acceptanceStatus=acceptanceCurrent?acceptance.status:'pending';
  const passedMultiGroups=acceptanceCurrent?hybridPresets.filter(preset=>acceptance.multi?.[preset.key]?.status==='passed').length:0;
  const fusionRecord=scoreCharacter?.fusion?.[slotId];
  const fusionHistory=Array.isArray(fusionRecord)?fusionRecord:Array.isArray(fusionRecord?.reviews)?fusionRecord.reviews:fusionRecord?[fusionRecord]:[];
  const fidelityEntry=scoreCharacter?.reference;
  const fidelityScore=reviewedScore(fidelityEntry,completeHash,REFERENCE_PASS);
  const bodyRecord=scoreCharacter?.body;
  const bodyHistory=Array.isArray(bodyRecord)?bodyRecord:Array.isArray(bodyRecord?.reviews)?bodyRecord.reviews:bodyRecord?[bodyRecord]:[];
  const bodyEntry=bodyHistory.find(entry=>entry?.seed===seed&&entry.corpusSignature===corpusSignature&&entry.reviewedBodyHash===bodyHash)||[...bodyHistory].reverse().find(entry=>entry?.reviewedBodyHash===bodyHash&&entry.bodyCorpusHash===bodyCorpus?.hash)||bodyHistory.find(entry=>entry?.seed===seed)||bodyHistory.at(-1);
  const visualBodyScore=bodyReady?reviewedBodyScore(bodyEntry,bodyHash,seed,bodyCorpus,corpusSignature,selectedCorpus):{text:'冻结素体资源待刷新',passed:false,pending:true};
  const resolvedBodyAnatomy=resolveBodyAnatomicalGate(scoreCharacter?.anatomicalAudits,bodyHash);
  const bodyAnatomicalBlockers=resolvedBodyAnatomy.blockers;
  const bodyAnatomicalReviewRequired=resolvedBodyAnatomy.status==='pending'||resolvedBodyAnatomy.status==='not-reviewed';
  const bodyAnatomicalGate={status:resolvedBodyAnatomy.status,tolerancePercent:5,scope:resolvedBodyAnatomy.scope,policy:resolvedBodyAnatomy.policy,reports:[...resolvedBodyAnatomy.reviews,...resolvedBodyAnatomy.outstandingHistory].map(({sourceReport,requiresRevision,requiresFurtherAudit,reviewedBodyHash})=>({sourceReport,requiresRevision,...(requiresFurtherAudit?{requiresFurtherAudit:true}:{}),reviewedBodyHash}))};
  const bodyAnatomicalGateSignature=JSON.stringify(bodyAnatomicalGate);
  const retainedVisualBodyScore=bodyEntry?.reviewedBodyHash===bodyHash&&Number.isFinite(bodyEntry?.score)?bodyEntry.score:null;
  const bodyScore=!bodyReady?visualBodyScore:bodyAnatomicalBlockers.length?{text:`${retainedVisualBodyScore===null?'':`已有视觉 ${retainedVisualBodyScore} · `}形体需返工`,passed:false,pending:false,visualPending:visualBodyScore.pending,anatomicalBlocked:true}:bodyAnatomicalReviewRequired?{text:`${retainedVisualBodyScore===null?'':`已有视觉 ${retainedVisualBodyScore} · `}形体待复核`,passed:false,pending:retainedVisualBodyScore===null||retainedVisualBodyScore>=BODY_PASS,visualPending:visualBodyScore.pending,anatomicalReviewRequired:true}:visualBodyScore;
  const excludedSlots=useMemo(()=>{
    const requested=[...new Set([...(clearView&&canClearDecor?decorSlots:[]),...hiddenNativeDecor])].filter(id=>!selectedAiSlots.includes(id));
    const native=manifest.slots.filter(s=>!selectedAiSlots.includes(s.id)).map(s=>s.id);
    if(native.length&&native.every(id=>requested.includes(id)))return requested.filter(id=>id!==(native.includes('background')?'background':native[0]));
    return requested;
  },[clearView,canClearDecor,hiddenNativeDecor,selectedAiSlots,manifest.slots]);
  const forcedManifest=useMemo(()=>{
    const forced=new Map(selectedAiSlots.flatMap(id=>{
      const item=selectedTargets[id];if(!item)return [];
      const variant=currentVariant(item,characterId);
      const native=item.defaultVariant?.poseFamily===REFINED_FAMILY&&item.defaultVariant?.variantRole==='native-display'?item.defaultVariant:variant;
      return [[item.id,{...item,...variant,defaultVariant:native,poseVariants:{...item.poseVariants,[characterId]:variant}}]];
    }));
    return {...manifest,items:manifest.items.map(item=>forced.get(item.id)||item)};
  },[manifest,selectedAiSlots,selectedTargets,characterId]);
  const cases=useMemo(()=>{
    if(!review)return [];
    return Array.from({length:contextCount},(_,fixtureIndex)=>{
      const nativeSelection=Object.fromEntries(manifest.slots.map((s,slotIndex)=>[s.id,draws[s.id][(fixtureIndex+arrangement*((nativeLowerCoupled&&(review.completenessPolicy?.coupledSlots||['legs','bottom']).includes(s.id)?manifest.slots.findIndex(slot=>slot.id==='legs'):slotIndex)+1))%contextCount]]));
      const aiSelection={...nativeSelection,...selectedItemIDs};
      const baselineLayers=resolveClassicLayers(manifest,nativeSelection,{excludeSlots:excludedSlots});
      const aiLayers=resolveClassicLayers(forcedManifest,aiSelection,{excludeSlots:excludedSlots});
      return {id:`${characterId}-${hybridKey}-s${seedDigest(seed).toString(16)}-a${arrangement}-f${fixtureIndex}`,seed,fixtureIndex,nativeSelection,aiSelection,baselineLayers,aiLayers,isolatedNativeLayers:resolveClassicLayers(manifest,nativeSelection,{excludeSlots:manifest.slots.filter(slot=>!selectedAiSlots.includes(slot.id)).map(slot=>slot.id)}),selectedAiSlots,selectedItemIDs,substitutedItemId:multipleAi?null:target?.id||null,substitutedSlot:multipleAi?null:slotId,forcedCurrentVersion:true,actualAiLayers:aiLayers.filter(layer=>selectedItemIDs[layer.slot]===layer.itemId).map(layer=>({...layer}))};
    });
  },[review,manifest,forcedManifest,target,characterId,slotId,selectedAiSlots,selectedItemIDs,hybridKey,multipleAi,seed,draws,contextCount,arrangement,excludedSlots,nativeLowerCoupled]);
  const generatedInterfaceHashes=useMemo(()=>Object.fromEntries(cases.flatMap(entry=>entry.actualAiLayers.filter(layer=>layer.generatedInterface).map(layer=>[entry.id+':'+layer.key,layer.artworkHash]))),[cases]);
  const selectedCompatibilityPolicies=useMemo(()=>Object.fromEntries(selectedAiSlots.map(slot=>[slot,itemCompatibilityPolicies(selectedTargets[slot])]).filter(([,policies])=>policies.length)),[selectedAiSlots,selectedTargets]);
  const conditionalCompatibility=Object.keys(selectedCompatibilityPolicies).length>0;
  const contextSignature=useMemo(()=>{
    const base={seed,poolHash:review?.poolHash,arrangement,selectedAiSlots,excludedSlots,selections:cases.map(entry=>entry.nativeSelection)};
    if(nativeLowerCoupled)Object.assign(base,{lowerPolicy:review.lowerPolicy,generatedInterfaceHashes,actualLowerLayers:cases.map(entry=>({native:entry.baselineLayers.filter(l=>['legs','bottom'].includes(l.slot)),mixed:entry.aiLayers.filter(l=>['legs','bottom'].includes(l.slot))}))});
    if(conditionalCompatibility)Object.assign(base,{selectedCompatibilityPolicies,actualAiLayers:cases.map(entry=>({caseId:entry.id,layers:entry.actualAiLayers}))});
    return (conditionalCompatibility?'native-context-v5-':nativeLowerCoupled?'native-context-v4-':'native-context-v3-')+seedDigest(JSON.stringify(base)).toString(16);
  },[seed,review?.poolHash,review?.lowerPolicy,arrangement,selectedAiSlots,excludedSlots,cases,nativeLowerCoupled,generatedInterfaceHashes,conditionalCompatibility,selectedCompatibilityPolicies]);
  const fusionEntry=fusionHistory.find(entry=>entry?.seed===seed&&entry.contextSignature===contextSignature&&entry.reviewedPartHash===partHash)||fusionHistory.find(entry=>entry?.seed===seed)||fusionHistory[0];
  const fusionScore=reviewedScore(fusionEntry,partHash,FUSION_PASS,'reviewedPartHash',{seed,contextSignature,generatedInterfaceHashes});
  const hybridRecord=scoreCharacter?.hybrid?.[hybridKey];
  const hybridHistory=Array.isArray(hybridRecord)?hybridRecord:Array.isArray(hybridRecord?.reviews)?hybridRecord.reviews:hybridRecord?[hybridRecord]:[];
  const hybridEntry=hybridHistory.find(entry=>entry?.seed===seed&&entry.contextSignature===contextSignature)||hybridHistory.find(entry=>entry?.seed===seed)||hybridHistory[0];
  const hybridScore=unavailableSelectedSlots.length?{text:'含角色不适用部件',passed:false,pending:true}:reviewedHybridScore(hybridEntry,partHashes,selectedAiSlots,seed,contextSignature,cases,generatedInterfaceHashes);
  const activeFusionScore=unavailableSelectedSlots.length?{text:'N/A · 角色无此部件',passed:false,pending:false,notApplicable:true}:multipleAi?hybridScore:fusionScore,activeFusionEntry=multipleAi?hybridEntry:fusionEntry;
  const fullLayers=useMemo(()=>resolveClassicLayers(manifest,character.preset),[manifest,character]);
  const snapshot=useMemo(()=>({runtimeArchive:manifest.reviewArchive||null,schema:nativeLowerCoupled?'classic-react-review-v3':'classic-react-review-v2',...(conditionalCompatibility?{conditionalCompatibility:true,selectedCompatibilityPolicies,contextSignatureVersion:5}:{}),lowerPolicy:review?.lowerPolicy||null,generatedInterfaceHashes,nativeLowerCoupled,generatedInterfaceRule:'AI-owned replacement support; fusion>=98; never native100',visibilityFollowUp:{requestedHiddenNativeDecor:hiddenNativeDecor,originalDrawsUnchanged:true,substitutesForUnhiddenReview:false},isolatedDiagnostics:{enabled:inspectSelected,source:'Same cases and resolved layers, filtered to selected AI slots for supplementary unobstructed inspection',replacesFullMixScoring:false},character:characterId,slot:slotId,selectedAiSlots,selectedItemIDs,unavailableSelectedSlots,roleUnavailableSlots,presetExclusions,reviewedPartHashes:partHashes,hybridKey,mode,seed,contextSignature,poolHash:review?.poolHash||null,draws,arrangement,scale,surface,animate,excludedSlots,artworkApplied:applied,artworkFamily:manifest.poseFamily,reviewedCompleteHash:completeHash||null,reviewedPartHash:partHash||null,bodyHash:bodyHash||null,bodyCopyHash:reviewCharacter?.bodyArtworkHash||null,bodyReady,bodyCorpus:{total:bodyCorpus?.total||0,required:bodyCorpus?.requiredSamples||20,ready:bodyCorpus?.ready||false,bodyCorpusHash:bodyCorpus?.hash||null,selectionMode:corpusAll?'all':'random',selectedIds:selectedCorpus.map(sample=>sample.id),selected:selectedCorpus,analysisSrc:bodyCorpus?.analysisSrc||null,analysisJsonSrc:bodyCorpus?.analysisJsonSrc||null,analysisReviewer:bodyCorpus?.analysisReviewer||null,missingDependencies:bodyCorpus?.missingDependencies||[],corpusSignature,score:bodyScore,anatomicalGate:bodyAnatomicalGate},baselineScore:100,baselineAuthority:'User instruction',thresholds:{fusion:FUSION_PASS,reference:REFERENCE_PASS,body:BODY_PASS},coverage:{nativeItems:review?.items?.length||0,originalsPerSlot:review?.nativePartsPerSlot||0,nativeCounts:review?.nativeCounts||null,completenessPolicy:review?.completenessPolicy?.id||null,fixturesOnThisPage:contextCount,substitutionsPerContext:selectedAiSlots.length,drawWithoutReplacement:true,newSeedPerReview:true,arrangements:5,selectedAiSlotsCount:selectedAiSlots.length,nativeSlotsCount:manifest.slots.length-selectedAiSlots.length,visibleNativeSlotsCount:manifest.slots.filter(s=>!selectedAiSlots.includes(s.id)&&!excludedSlots.includes(s.id)).length,hybridPresetCount:hybridPresets.length,corpusCoverage:{selected:selectedCorpus.length,total:bodyCorpus?.total||0,enumeratedAll:corpusAll&&selectedCorpus.length===bodyCorpus?.requiredSamples},exhaustive:false},forceRefinePolicy:'Every selected AI item uses current-family artwork only. Authored current native-display variants are selected by the shared resolver for native tops; own-pose variants are used with the matching AI top. Historical defaultVariants are excluded from review. Hashes cover both current variants.',cases:cases.map(({baselineLayers,aiLayers,...entry})=>({...entry,baselineLayers:baselineLayers.map(layer=>({...layer})),aiLayers:aiLayers.map(layer=>({...layer}))})),fullPreset:character.preset,fullLayers:fullLayers.map(layer=>({...layer})),scoreStatus:{fusion:activeFusionScore,singleFusionDiagnostic:fusionScore,hybrid:hybridScore,body:bodyScore,reference:fidelityScore},reference:reviewCharacter?.reference||null}),[characterId,slotId,selectedAiSlots,selectedItemIDs,partHashes,hybridKey,mode,seed,contextSignature,draws,contextCount,arrangement,scale,surface,animate,excludedSlots,inspectSelected,hiddenNativeDecor,applied,manifest.poseFamily,completeHash,partHash,bodyHash,bodyReady,bodyAnatomicalGateSignature,review,cases,character.preset,fullLayers,fusionScore.text,activeFusionScore.text,activeFusionScore.passed,hybridScore.text,bodyCorpus,selectedCorpus,corpusSignature,corpusAll,bodyScore.text,bodyScore.passed,fidelityScore.text,reviewCharacter,nativeLowerCoupled,generatedInterfaceHashes]);
  useEffect(()=>{
    window.__classicReview={snapshot};
    window.__classicReviewEvidence=snapshot;
    return()=>{delete window.__classicReview;delete window.__classicReviewEvidence;};
  },[snapshot]);
  function selectAiSlots(values){
    const selected=canonicalSlots(values,manifest.slots);
    if(!selected.length)return;
    setAiSlots(selected);setSlotId(roleSlots(selected,manifest,characterId)[0]);setSeed(newSeed());setArrangement(0);
  }
  function downloadSnapshot(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`${characterId}-${slotId}-s${seedDigest(seed).toString(16)}-a${arrangement}-${mode}-react-review.json`;link.click();URL.revokeObjectURL(url);
  }
  function nextCase(){
    const nextSlot=manifest.slots.findIndex(s=>s.id===slotId)+1;
    if(nextSlot<manifest.slots.length)selectAiSlots([manifest.slots[nextSlot].id]);
    else {selectAiSlots([manifest.slots[0].id]);setCharacterId(manifest.characters[(manifest.characters.findIndex(c=>c.id===characterId)+1)%manifest.characters.length].id);}
  }
  if(!review)return <div className="classic-review-shell"><h1>Classic 独立审阅台</h1><p>原生部件尚未生成。请运行 <code>node tools/build-classic-native-review.mjs</code> 后刷新。</p><a href="/">返回衣橱</a></div>;
  return <div className={`classic-review-shell surface-${surface}`} style={{'--review-scale':scale}} data-review-mode={mode} data-character={characterId} data-slot={slotId} data-review-seed={seed} data-context-signature={contextSignature} data-selected-ai-slots={selectedAiSlots.join(',')} data-hybrid-key={hybridKey} data-corpus-signature={corpusSignature} data-arrangement={arrangement} data-current-refine={applied?'true':'false'} data-artwork-hash={completeHash||''} data-part-artwork-hash={partHash||''} data-body-artwork-hash={bodyHash||''}>
    <header className="review-header"><div><span className="review-eyebrow">AI SHOW / CLASSIC MATERIAL REVIEW</span><h1>原生混搭 · 独立验收台</h1><p>原生组合按规则 100 分。多件融合与素体 ≥98；全套立绘 ≥90。单件仅作诊断，分数由独立评审提供。</p></div><a href="/" className="review-link">返回换装衣橱 ↗</a></header>
    <section className="review-final-status" data-final-acceptance={acceptanceStatus} aria-label="角色总验收状态"><b>{character.name} 总验收：{acceptanceLabel(acceptanceStatus)}</b><span>素体 {acceptanceLabel(acceptanceCurrent?acceptance.body?.status:'pending')} · 立绘 {acceptanceLabel(acceptanceCurrent?acceptance.reference?.status:'pending')} · 多件 {passedMultiGroups} / {hybridPresets.length} 组已通过</span><small>default＋20例与全部{hybridPresets.length}组多件须达标；含上衣、裙装、腿足接口，单件分数不代替组合验收。</small></section>
    {reviewArchive&&<p className="review-pending" role="status">历史输入回放 · {reviewArchive}。图像全部读取这份冻结归档；只补该轮审阅证据，不代表当前新版验收。</p>}
    <div className="review-controls" data-review-controls>
      <label>角色<select aria-label="审阅角色" value={characterId} onChange={e=>{setCharacterId(e.target.value);setSeed(newSeed());setArrangement(0);}}>{manifest.characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>单件诊断<select aria-label="审阅部件" value={slotId} onChange={e=>selectAiSlots([e.target.value])}>{manifest.slots.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>抽样 seed<input aria-label="抽样 seed" value={seed} maxLength={160} onChange={e=>{setSeed(e.target.value||newSeed());setArrangement(0);}}/></label>
      <label>本组复排<select aria-label="排列组合" value={arrangement} onChange={e=>setArrangement(Number(e.target.value))}>{[0,1,2,3,4].map(i=><option key={i} value={i}>排列 {i+1} / 5</option>)}</select></label>
      <label>检查维度<select aria-label="检查维度" value={mode} onChange={e=>setMode(e.target.value)}><option value="component">① 原生融合</option><option value="full">② 立绘还原</option><option value="body">专属素体</option></select></label>
      <label>像素比例<select aria-label="像素比例" value={scale} onChange={e=>setScale(Number(e.target.value))}>{[1,2,3].map(i=><option key={i} value={i}>{i}× 原生</option>)}</select></label>
      <label>衬底<select aria-label="审阅衬底" value={surface} onChange={e=>setSurface(e.target.value)}><option value="light">浅色</option><option value="dark">深色</option></select></label>
      <label className="review-checkbox"><input type="checkbox" checked={animate} onChange={e=>setAnimate(e.target.checked)}/>原始动效</label>
      <label className="review-checkbox"><input type="checkbox" checked={clearView&&canClearDecor} disabled={!canClearDecor} onChange={e=>setClearView(e.target.checked)}/>关闭非目标装饰</label>
      <label className="review-checkbox"><input type="checkbox" checked={inspectSelected} onChange={e=>setInspectSelected(e.target.checked)}/>展开部件分离对照</label>
      <button onClick={()=>{setSeed(newSeed());setArrangement(0);}} className="review-button" data-randomize-native>重新随机一组</button><button onClick={nextCase} className="review-button">下一部件 →</button><button onClick={downloadSnapshot} className="review-button">导出本页证据 JSON</button>
    </div>
    {mode==='component'&&<section className="review-hybrid-picker" aria-label="AI部件组合">
      <div className="review-hybrid-slots" aria-label="原生遮挡复查"><span>遮挡复查 · 隐藏原生非目标装饰：</span>{occludingDecor.map(id=><label key={id}><input type="checkbox" checked={excludedSlots.includes(id)} disabled={selectedAiSlots.includes(id)||(!excludedSlots.includes(id)&&manifest.slots.filter(s=>!selectedAiSlots.includes(s.id)&&!excludedSlots.includes(s.id)).length<=1)} onChange={e=>{setClearView(false);setHiddenNativeDecor(e.target.checked?[...new Set([...excludedSlots.filter(value=>occludingDecor.includes(value)),id])]:excludedSlots.filter(value=>occludingDecor.includes(value)&&value!==id));}}/>{manifest.slots.find(s=>s.id===id)?.label}</label>)}</div>
      <div className="review-hybrid-presets">{hybridPresets.map(preset=><button key={preset.key} className="review-button" data-review-group={preset.key} aria-pressed={hybridKey===preset.key} onClick={()=>selectAiSlots(preset.slots)}>{preset.label}{roleSlots(preset.slots,manifest,characterId).length!==preset.slots.length?`（适用${roleSlots(preset.slots,manifest,characterId).length}）`:''}</button>)}</div>
      <div className="review-hybrid-slots">{manifest.slots.map(s=><label key={s.id}><input type="checkbox" checked={selectedAiSlots.includes(s.id)} disabled={selectedAiSlots.includes(s.id)?selectedAiSlots.length===1:selectedAiSlots.length>=manifest.slots.length-1||!isApplicable(manifest.items.find(item=>item.id===character.preset[s.id]))} onChange={e=>selectAiSlots(e.target.checked?[...selectedAiSlots,s.id]:selectedAiSlots.filter(id=>id!==s.id))}/>{s.label}</label>)}</div>
      <p>当前 {selectedAiSlots.length} 项 AI + {manifest.slots.length-selectedAiSlots.length} 项原生，组合键 <code>{hybridKey}</code>。每次更换组合产生新 seed；至少保留一个原生槽，纯 AI 全套请进入立绘还原页。单件诊断分数不代表多件搭配通过。</p>
      {presetExclusions.length>0&&<p className="review-applicability">本角色预设已排除：{presetExclusions.map(row=>`${row.name}（${row.reason}）`).join('；')}。组合名称保留，计分仅绑定上述实际适用槽位。</p>}
      {unavailableSelectedSlots.length>0&&<p className="review-applicability">此项为 N/A，不参与 98 分验收：{roleUnavailableSlots.filter(row=>unavailableSelectedSlots.includes(row.slot)).map(row=>`${row.name}（${row.reason}）`).join('；')}</p>}
    </section>}
    <nav className="review-mode-tabs" aria-label="审阅维度"><button aria-pressed={mode==='component'} onClick={()=>setMode('component')}>① 部件融合</button><button aria-pressed={mode==='full'} onClick={()=>setMode('full')}>② 全套立绘</button><button aria-pressed={mode==='body'} onClick={()=>setMode('body')}>素体专项</button></nav>
    {nativeLowerCoupled&&<p className="review-provenance">原生参照完整下装只使用真实首帧，用户基准100。AI裙的隐藏补片、上衣接原生腰线的作者接触层均单列为 generatedInterface，按所属AI部件融合98评审。原生裙配AI腿仅保留真实腰肤context。<a href="/workplace/LLM-show-classic/rating-rules/COMPATIBILITY_INTERFACES.md">接口与来源契约</a></p>}
    {!applied&&<p className="review-pending" role="status">本轮七人重制尚未接入当前 manifest。原生基准可查看，AI 部件暂不显示、不计分，避免把旧 standing 资源误当本轮重制。</p>}
    {mode==='component'&&<>
      <section className="review-score-line"><h2>{character.name} / {multipleAi?matchedPreset?.label||'自定义多件组合':`${slot.label} · 单件诊断`} <small>同时替入 {selectedAiSlots.length} 项本次重制部件</small></h2><div className={`review-score ${activeFusionScore.notApplicable?'not-applicable':activeFusionScore.pending?'pending':activeFusionScore.passed?'passed':'rejected'}`} data-fusion-score={activeFusionScore.notApplicable?'not-applicable':activeFusionScore.pending?'pending':activeFusionEntry.score} data-fusion-kind={multipleAi?'hybrid':'single-diagnostic'}><span>{multipleAi?'多件融合':'单件诊断'}</span><b>{activeFusionScore.text}</b><small>门槛 {FUSION_PASS}</small></div></section>
      <p className="review-method">本轮从每槽 {poolCountLabel} 件原生池中无放回抽取 {contextCount} 件，{nativeLowerCoupled?'下装与腿按同一原件联动，纯原生上行使用完整源图；启用完整性策略时上衣也联动，其他槽独立。':'沿用冻结旧池抽样策略。'}组成 {contextCount} 组原生上下文。对应AI组合将 <b>{selectedAiSlots.map(id=>manifest.slots.find(s=>s.id===id)?.label).join('、')}</b> 换为当前角色的本次重制部件；其余选择和隐藏项与原生参照相同。seed <code>{seed}</code> · 证据签名 <code>{contextSignature}</code>。多件组须独立评分，不能从单件分推导通过。</p>
      <div className="review-grid-scroll"><div className="review-case-grid" data-review-matrix>
        {cases.map(entry=><article className="review-native-case" key={`native-${entry.id}`} data-case-id={entry.id} data-kind="native" data-baseline-score="100"><div className="review-case-caption"><b>原生 {entry.fixtureIndex+1}{nativeLowerCoupled?' · 完整下装原件':''}</b><span>100 · 用户基准</span></div><Doll animate={animate} layers={entry.baselineLayers} className="review-doll" label={`原生上下文${entry.fixtureIndex+1}`}/><small>{selectedAiSlots.map(id=>entry.nativeSelection[id]).join(' · ')}</small></article>)}
        {cases.map(entry=><article className="review-ai-case" key={`ai-${entry.id}`} data-case-id={entry.id} data-kind="ai" data-ai-item={Object.values(entry.selectedItemIDs).join('|')} data-selected-ai-slots={entry.selectedAiSlots.join(',')} data-ai-source={entry.actualAiLayers.map(l=>l.src).join('|')} data-generated-interface-count={entry.actualAiLayers.filter(l=>l.generatedInterface).length}><div className="review-case-caption"><b>{character.name} · {selectedAiSlots.length} 件</b><span>{entry.actualAiLayers.some(l=>l.generatedInterface)?'含AI归属接口 · 98评审':multipleAi?'独立多件评审':'单件诊断'}</span></div>{applied?<Doll animate={animate} layers={entry.aiLayers} className="review-doll" label={`${character.name}${hybridKey}混搭上下文${entry.fixtureIndex+1}`}/>:<div className="review-doll review-not-applied">待本轮重制接入</div>}<small>{Object.values(entry.selectedItemIDs).join(' · ')}</small></article>)}
      </div></div>
      {inspectSelected&&<section className="review-isolated-diagnostics">
        <h3>本轮所选部件 · 分离诊断</h3><p className="review-method">仍用上方相同 seed、选择和实际图层，仅把未选槽位隐藏，检查被头发、扫描罩或其他原生装饰遮住的目标。上方完整混搭保留；分离画面只能补充笔触和材质证据，不能代替正式融合评分。</p>
        <div className="review-grid-scroll"><div className="review-case-grid" data-isolated-review-matrix>
          {cases.map(entry=><article className="review-native-case" key={`isolated-native-${entry.id}`} data-isolated-case-id={entry.id}><div className="review-case-caption"><b>原生部件 {entry.fixtureIndex+1}</b><span>100 · 用户基准</span></div><Doll animate={animate} layers={entry.isolatedNativeLayers} className="review-doll" label={`原生所选部件分离${entry.fixtureIndex+1}`}/></article>)}
          {cases.map(entry=><article className="review-ai-case" key={`isolated-ai-${entry.id}`} data-isolated-case-id={entry.id}><div className="review-case-caption"><b>{character.name} · 所选部件</b><span>补充诊断</span></div>{applied?<Doll animate={animate} layers={entry.aiLayers.filter(layer=>selectedAiSlots.includes(layer.slot))} className="review-doll" label={`${character.name}所选部件分离${entry.fixtureIndex+1}`}/>:<div className="review-doll review-not-applied">待本轮重制接入</div>}</article>)}
        </div></div>
      </section>}
      {activeFusionEntry&&<ReviewReasons entry={activeFusionEntry} stale={activeFusionScore.pending}/>}
    </>}
    {mode==='full'&&<>
      <section className="review-score-line"><h2>{character.name} / 全套标准立绘还原</h2><div className={`review-score ${fidelityScore.pending?'pending':fidelityEntry.score>=REFERENCE_PASS?'passed':'rejected'}`} data-reference-score={fidelityScore.pending?'pending':fidelityEntry.score}><span>立绘还原</span><b>{fidelityScore.text}</b><small>门槛 {REFERENCE_PASS}</small></div></section>
      <div className="review-full-grid"><figure><div className="review-reference"><img src={reviewCharacter?.reference} alt={`${character.name}标准比例立绘`}/></div><figcaption>标准比例立绘 · 动作、神态、发型、服饰与配件依据 {reviewCharacter?.referenceMarkdown && <a href={reviewCharacter.referenceMarkdown} target="_blank" rel="noreferrer">角色 README ↗</a>}</figcaption></figure><figure>{applied?<Doll animate={animate} layers={fullLayers} className="review-doll" label={`${character.name}本次重制全套`}/>:<div className="review-doll review-not-applied">待本轮重制接入</div>}<figcaption>本次重制全套 · 共享衣橱图层解析</figcaption></figure><figure>{bodyReady?<img className="review-body-image" src={reviewCharacter.body} alt={`${character.name}本次素体`}/>:<div className="review-doll review-not-applied">素体副本待刷新</div>}<figcaption>独立素体 · 不用长发与裙摆遮住体块</figcaption></figure></div>
      {fidelityEntry&&<ReviewReasons entry={fidelityEntry} stale={fidelityScore.pending}/>}
    </>}
    {mode==='body'&&<>
      <section className="review-score-line"><h2>{character.name} / default 身体重摆立绘姿态</h2><div className={`review-score ${bodyScore.pending?'pending':bodyScore.passed?'passed':'rejected'}`} data-body-score={bodyScore.pending?'pending':bodyEntry?.score??'unscored'} data-anatomical-gate={bodyAnatomicalGate.status}><span>素体融合</span><b>{bodyScore.text}</b><small>门槛 {BODY_PASS}</small></div></section>
      {bodyAnatomicalBlockers.length>0&&<section className="review-pending" role="status" data-anatomical-blockers><b>当前素体形体复核未通过</b><p>原视觉评分保留。独立量测发现同一版本的体量差异，修订后须重新验收；视觉98分不能覆盖已确认的尺寸问题。</p>{bodyAnatomicalBlockers.map((audit,index)=><div key={`${audit.sourceReport}-${index}`}><a href={`/${audit.sourceReport.replace(/\.json$/,'.md')}`} target="_blank" rel="noreferrer">查看独立量测与原生控制 ↗</a><ul>{(audit.confirmedFindings||[]).map((finding,i)=><li key={i}>{typeof finding.reason==='string'?finding.reason:typeof finding.summary==='string'?finding.summary:JSON.stringify(finding)}</li>)}</ul></div>)}</section>}
      {!bodyAnatomicalBlockers.length&&bodyReady&&bodyAnatomicalReviewRequired&&<section className="review-pending" role="status" data-anatomical-clearance-required><b>当前素体需要独立形体复核</b><p>{resolvedBodyAnatomy.outstandingHistory.length?'此前已确认的尺寸问题须由新版本量测明确解除。改版本哈希或重新抽样不会自动清除问题。':'可直接比较的可见体量尚待独立量测。视觉评分与形体守门都通过后，才能验收。'}原视觉评分继续保留。</p>{resolvedBodyAnatomy.outstandingHistory.map((audit,index)=><p key={`${audit.sourceReport}-${index}`}><a href={`/${audit.sourceReport.replace(/\.json$/,'.md')}`} target="_blank" rel="noreferrer">查看此前素体 {audit.reviewedBodyHash.slice(0,8)} 的待解除问题 ↗</a></p>)}</section>}
      <p className="review-method">素体须同时对照真实 default 与不同着装、姿态、发型的女性 classic。比较体块收放、连续关节、笔触覆盖、色阶和均匀程度；不要求所有样例摆同一动作，也不把衣裙包络当裸身真值。Blingee、像素背景用于理解原生纸娃娃语言，不要求裸肤铺满 glitter。</p>
      <div className="review-full-grid"><figure><Doll animate={false} layers={resolveClassicLayers(manifest,manifest.basePreset)} className="review-doll" label="真实原始default"/><figcaption>真实 default · 原上衣与灰裙包络</figcaption></figure><figure>{bodyReady?<img className="review-body-image" src={reviewCharacter.body} alt={`${character.name}专属素体`}/>:<div className="review-doll review-not-applied">素体副本待刷新</div>}<figcaption>本次独立素体 · 同原生坐标</figcaption></figure><figure><div className="review-reference"><img src={reviewCharacter?.reference} alt={`${character.name}标准比例立绘`}/></div><figcaption>标准立绘 · 所需动作与重心</figcaption></figure></div>
      <section className="review-corpus-toolbar"><div><h3>不同着装与姿态的原生素体标尺</h3><p>本轮 {selectedCorpus.length} / {bodyCorpus?.requiredSamples||20} 个样例 · {corpusAll?'全部枚举':'seed 无放回抽样'}；这项分数独立于单件混搭与全套立绘分。</p></div><label><input type="checkbox" data-body-corpus-all checked={corpusAll} onChange={e=>setCorpusAll(e.target.checked)}/>查看全部 {bodyCorpus?.requiredSamples||20}</label><button className="review-button" onClick={()=>{setSeed(newSeed());setArrangement(0);}}>重新随机素体样例</button><div className="review-corpus-links">{bodyCorpus?.analysisSrc&&<a href={bodyCorpus.analysisSrc} target="_blank" rel="noreferrer">20 样例逐张分析 MD ↗</a>}{bodyCorpus?.analysisJsonSrc&&<a href={bodyCorpus.analysisJsonSrc} target="_blank" rel="noreferrer">分析与来源 JSON ↗</a>}</div></section>
      {!bodyCorpus?.ready&&<p className="review-pending" role="status">20 个原生样例或逐张分析材料尚未齐全，当前不作素体通过声明。{(bodyCorpus?.missingDependencies||[]).join('；')}</p>}
      <p className="review-method">原生样例固定 100 为用户指定基准。当前{corpusAll?'全 20 项':'仅本轮抽样项'}需逐项独立评分；只对 default 或一个测量点通过，不能代替这组验收。签名 <code>{corpusSignature}</code>。</p>
      <div className="review-body-corpus-grid" data-body-corpus-matrix data-corpus-mode={corpusAll?'all':'random'} data-corpus-selected={selectedCorpus.map(sample=>sample.id).join(',')}>
        {selectedCorpus.map(sample=>{
          const perSample=sampleScore(bodyEntry,sample.id),currentScore=!(bodyScore.visualPending??bodyScore.pending)&&Number.isFinite(perSample?.score)?perSample.score:null;
          return <article className="review-body-corpus-card" key={sample.id} data-corpus-sample-id={sample.id} data-native-image-hash={sample.imageHash} data-body-image-hash={bodyHash||''}>
            <header><b>#{sample.id} · {sample.label}</b><span>{sample.pose}</span></header>
            <div className="review-body-corpus-pair"><figure><img className="review-body-image" src={sample.src} alt={`原生女性classic样例${sample.id} ${sample.label}`}/><figcaption>原生 100 · 用户基准</figcaption></figure><figure>{bodyReady?<img className="review-body-image" src={reviewCharacter.body} alt={`${character.name}素体对照样例${sample.id}`}/>:<div className="review-doll review-not-applied">素体副本待刷新</div>}<figcaption className={currentScore===null?'':currentScore>=BODY_PASS&&!bodyScore.anatomicalBlocked&&!bodyScore.anatomicalReviewRequired?'corpus-score-passed':'corpus-score-rejected'} data-sample-score={currentScore??'pending'}>{character.name} 素体 · {currentScore===null?'待本轮独立评分':bodyScore.anatomicalBlocked?`视觉 ${currentScore} / 100 · 形体需返工`:bodyScore.anatomicalReviewRequired?`视觉 ${currentScore} / 100 · 形体待复核`:`${currentScore} / 100`}</figcaption></figure></div>
            <details><summary>体块、笔触和风格分析 / 原件来源</summary>{sample.analysis&&Object.entries(sample.analysis).filter(([key])=>key!=='title').map(([key,value])=><p key={key}><b>{{bodyAndJoints:'体块与关节',brushColorMaterial:'笔触、色阶与材质',hairContourAndHighlights:'发型轮廓与高光',transferable:'可借用',nonTransferable:'不能照搬'}[key]||key}：</b>{value}</p>)}<p><b>原件：</b>{sample.source}</p><p><b>发型：</b>{sample.hair}</p><pre>{JSON.stringify({layers:sample.layers,imageHash:sample.imageHash},null,2)}</pre></details>
          </article>;
        })}
      </div>
      {bodyEntry&&<ReviewReasons entry={bodyEntry} stale={bodyScore.pending}/>}
    </>}
    <details className="review-evidence"><summary>本页实际选择与图层证据</summary><pre data-review-evidence>{JSON.stringify(snapshot,null,2)}</pre></details>
    <p className="review-footnote">当前原生池 {manifest.slots.length} 槽，每槽 {poolCountLabel} 件，共 {review.items.length} 件；本页每槽无放回随机抽 {contextCount} 件。原生基准 100 为用户指定；没有自动 AI 分数。静态图取真实首帧；开启动效时使用原 GIF。seed 固定本轮抽样；重新随机产生新 seed，复排只改变本轮样本顺序。当前是有限覆盖，并非穷举所有组合。审阅仅用本轮版本；原生姿态若有本轮展示 variant 则按共享解析器使用，否则采用本轮 own variant，排除历史素材。</p>
  </div>;
}

function ReviewReasons({entry,stale}){
  const reasons=entry.reasons||entry.findings||[];
  const recommendations=[...(Array.isArray(entry.recommendations)?entry.recommendations:[]),...(Array.isArray(reasons)?reasons.flatMap(reason=>typeof reason==='object'&&reason?.recommendation?[reason.recommendation]:[]):[])];
  return <section className="review-reasons"><h3>{stale?'既有记录（当前版本或本轮随机组待复审）':'独立评审记录'}</h3>{entry.reviewer&&<p>评审：{entry.reviewer}</p>}{Array.isArray(reasons)?<ul>{reasons.map((reason,index)=><li key={index}>{typeof reason==='string'?reason:reason?.objection||reason?.observation||JSON.stringify(reason)}</li>)}</ul>:<p>{String(reasons)}</p>}{recommendations.length>0&&<><h4>修改建议</h4><ul>{[...new Set(recommendations)].map((recommendation,index)=><li key={index}>{typeof recommendation==='string'?recommendation:JSON.stringify(recommendation)}</li>)}</ul></>}{entry.sourceReport&&<p>评分来源：<code>{entry.sourceReport}</code></p>}{entry.evidence&&<pre>{JSON.stringify(entry.evidence,null,2)}</pre>}</section>;
}
