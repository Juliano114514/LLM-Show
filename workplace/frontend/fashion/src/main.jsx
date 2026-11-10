import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import modelSource from './review-model.mjs?raw';
import * as latestModel from './review-model.mjs';
let {AI,anatomyOrder,nativeSelection,aiSelection,makeCases,sourceOf,visualLayers,selectionKey,nativeBaseline}=latestModel;
let standardMannequinLayers=latestModel.standardMannequinLayers;

async function loadRetainedReviewModel(session){
  let text=modelSource,retained=latestModel;
  if(session.modelUrl){
    if(!/^\/review-rounds\/round-[1-9]\d*\/review-model\.mjs$/.test(session.modelUrl))throw new Error('渲染模型来源路径无效');
    const response=await fetch(session.modelUrl);if(!response.ok)throw new Error('该轮冻结渲染模型缺失');text=await response.text();
  }
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)),hash=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
  if(session.renderModelHash&&session.renderModelHash!==hash)throw new Error('冻结渲染模型哈希不匹配');
  if(session.modelUrl){const moduleUrl=URL.createObjectURL(new Blob([text],{type:'text/javascript'}));try{retained=await import(/* @vite-ignore */ moduleUrl);}finally{URL.revokeObjectURL(moduleUrl);}}
  for(const key of ['nativeSelection','aiSelection','makeCases','sourceOf','visualLayers','selectionKey','nativeBaseline'])if(typeof retained[key]!=='function')throw new Error('冻结渲染模型接口缺失：'+key);
  ({AI,anatomyOrder,nativeSelection,aiSelection,makeCases,sourceOf,visualLayers,selectionKey,nativeBaseline}=retained);
  // Retain legacy study rendering when displaying a historical grade/model.
  standardMannequinLayers=retained.standardMannequinLayers||((character)=>[...anatomyOrder.filter(key=>key!=='hands').map(key=>({key:'body.'+key,src:character.anatomy[key]})),...['face','features'].map(key=>({key,src:character.layers[key]})),{key:'body.hands',src:character.anatomy.hands}]);
  return hash;
}
function Composite({catalog,character,selection,background,outline=false}){
  const layers=visualLayers(catalog,selection,character);
  return <div className={'stage '+background+(outline?' outlines':'')} data-layer-count={layers.length}>{layers.map(layer=>layer.transform?<svg key={layer.key} className="transformed-layer" viewBox="0 0 140 226" data-slot={layer.key} data-origin={layer.ai?"ai":"native"}><g transform={layer.transform}><image href={layer.src} width="140" height="226"/></g></svg>:<img key={layer.key} src={layer.src} alt="" data-slot={layer.key} data-origin={layer.ai?"ai":"native"}/>)}<div className="scale">140 × 226 / ×2</div></div>;
}
function Mannequin({catalog,character,selection,background,standard=false}){
  const layers=standard?standardMannequinLayers(character):visualLayers(catalog,selection,character).filter(layer=>layer.key==='body'||layer.key.startsWith('body.')||['face','features','hands'].includes(layer.key));
  return <div className={'stage '+background}>{layers.map(layer=><img key={layer.key} src={layer.src} alt="" data-slot={layer.key} data-origin={standard?'ai':'native'}/>)}<div className="scale">140 × 226 / ×2 · 完整素体</div></div>;
}
function StandardEvidence({character,standardBody,lookBank}){
  const source=standardBody?.studyEvidence;
  if(!source||!/^\/review-rounds\/round-[1-9]\d*\/evidence\/[a-z]+\/standard-study\/study\.json$/.test(source))return null;
  return <section className="window"><div className="bar"><h2>标准素体 × 20 原始 Fashion SWF</h2><span>四组对照 · 点开放大</span></div><p className="study-intro">以下使用本轮冻结的{character.name}素体和20个真实原SWF首帧，含完整姿态与服装局部；透明、被遮区域不作解剖推断。评分仅以本轮独立报告为准。</p><div className="study-boards">{Array.from({length:4},(_,i)=>{const url=source.replace(/study\.json$/,'standard-vs-20-'+(i+1)+'.png');return <a key={url} href={url} target="_blank" rel="noopener"><img src={url} alt={`原始Fashion SWF ${i*5+1}至${i*5+5}与${character.name}标准素体并排对照`} loading="lazy"/><strong>第 {i*5+1}–{i*5+5} 个原始样例 ↗</strong></a>;})}</div><p className="study-intro"><a href={source} target="_blank" rel="noopener">查看20源覆盖范围与哈希 ↗</a>{lookBank&&<> · <a href="/reference-20-looks/all-native-20.png" target="_blank" rel="noopener">另看20套完整原生组装搭配 ↗</a>（补充语境，不是20个新原始套装SWF）</>}</p></section>;
}
function ReviewHistory({catalog,rounds}){
 const latest=new Map();
 for(const round of [...rounds].sort((a,b)=>b.round-a.round))for(const item of round.reviewedCharacters||[])if(!latest.has(item.id))latest.set(item.id,item);
 if(!latest.size)return null;
 return <section className="window"><div className="bar"><h2>各角色最近已评轮次</h2><span>点击轮次回看对应原图与意见</span></div><p className="study-intro">分数对应各自历史轮次，不代表本页当前组合。新稿、不同输入及未审组合不沿用这些评分。</p><div className="review-history"><table><thead><tr><th>角色 / 轮次</th><th>融合 / 98</th><th>立绘 / 90</th><th>素体 / 98</th><th>混搭已审</th><th>整套验收</th></tr></thead><tbody>{catalog.characters.map(character=>{const item=latest.get(character.id);return <tr key={character.id}><th>{item?<a href={`?round=${item.round}&character=${encodeURIComponent(character.id)}`}>{character.name} · R{item.round} ↗</a>:character.name}</th><td>{item?.integrationScore??'待审'}</td><td>{item?.identityScore??'待审'}</td><td className={item?.standardBodyAccepted?'passed':''}>{item?.standardBodyScore??'待审'}</td><td>{item?`${item.scoredCaseCount} / ${item.plannedCaseCount}`:'待审'}</td><td className={item?.accepted?'passed':''}>{item?.accepted?'已通过':item?'未通过':'待审'}</td></tr>;})}</tbody></table></div></section>;
}
function App(){
  const [catalog,setCatalog]=useState(null),[error,setError]=useState(''),[reviews,setReviews]=useState({}),[rounds,setRounds]=useState([]),[lookBank,setLookBank]=useState(null);
  useEffect(()=>{fetch('/review-rounds/index.json').then(r=>r.ok?r.json():[]).then(setRounds).catch(()=>{});},[]);
  useEffect(()=>{fetch('/reference-20-looks/manifest.json').then(r=>r.ok?r.json():null).then(setLookBank).catch(()=>{});},[]);
  const [characterId,setCharacterId]=useState('gpt'),[selectedSlot,setSelectedSlot]=useState('body'),[selection,setSelection]=useState(null),[background,setBackground]=useState('paper'),[mode,setMode]=useState('mixed'),[context,setContext]=useState(0),[caseIndex,setCaseIndex]=useState(0),[caseFilter,setCaseFilter]=useState('multi');
  useEffect(()=>{fetch((()=>{const round=Number(new URLSearchParams(location.search).get('round'));return Number.isInteger(round)&&round>0?'/review-rounds/round-'+round+'/session.json':'/review-session.json';})()).then(r=>{if(!r.ok)throw new Error('随机评审轮次尚未生成');return r.json();}).then(async reviewSession=>{const [data,ratings]=await Promise.all([fetch(reviewSession.catalogUrl||'/catalog.json').then(r=>{if(!r.ok)throw new Error('部件目录尚未生成');return r.json();}),fetch(reviewSession.reviewsUrl||'/reviews.json').then(r=>r.ok?r.json():{}).catch(()=>({}))]);if(reviewSession.protocol!=='fashion-react-mix-98-90-v2')throw new Error('需要抽取包含多AI部件的新轮次');if(reviewSession.nativeHash!==data.nativeHash)throw new Error('评审目录与本轮原生输入不一致');data.reviewSession=reviewSession;data.renderModelHash=await loadRetainedReviewModel(reviewSession);setReviews(ratings);setCatalog(data);setSelection(nativeSelection(data,0));const query=new URLSearchParams(location.search);if(query.get('character'))setCharacterId(query.get('character'));if(query.get('slot'))setSelectedSlot(query.get('slot'));}).catch(e=>setError(e.message));},[]);
  const character=catalog?.characters.find(c=>c.id===characterId)||catalog?.characters[0];
  const slot=catalog?.slots.find(s=>s.id===selectedSlot)||catalog?.slots[0];
  const cases=useMemo(()=>catalog&&character?makeCases(catalog,character):[],[catalog,character]);
  const filteredCases=cases.filter(item=>item.kind===caseFilter);
  const activeCase=filteredCases[caseIndex%Math.max(1,filteredCases.length)];
  const actualCase=selection?cases.find(item=>selectionKey(item.selection)===selectionKey(selection)):null;
  function applyCase(item){setSelection(item.selection);setContext(item.context);setSelectedSlot(item.kind==='single'?item.slot:selectedSlot);setMode(item.kind==='all-ai'?'identity':'mixed');const url=new URL(location.href);url.searchParams.set('case',item.id);url.searchParams.set('character',character.id);history.replaceState(null,'',url);}
  useEffect(()=>{
    if(!catalog||!character)return;
    const id=new URLSearchParams(location.search).get('case'),item=cases.find(item=>item.id===id)||cases.find(item=>item.kind==='multi');
    if(item){const nextUrl=new URL(location.href);nextUrl.searchParams.set('case',item.id);history.replaceState(null,'',nextUrl);setSelection(item.selection);setContext(item.context);setCaseFilter(item.kind);setCaseIndex(cases.filter(entry=>entry.kind===item.kind).findIndex(entry=>entry.id===item.id));if(item.kind==='single')setSelectedSlot(item.slot);setMode(item.kind==='all-ai'?'identity':'mixed');}
  },[catalog,characterId]);
  useEffect(()=>{
    if(!catalog||!character||!selection)return;
    window.__FASHION_REVIEW__={catalog,character,selection,mode,context,cases,activeCase:actualCase,version:catalog.revision,setCase:id=>{const item=cases.find(c=>c.id===id);if(!item)throw new Error('Unknown review case');applyCase(item);},setSelection:value=>setSelection({...value}),getLayers:()=>visualLayers(catalog,selection,character),setCharacter:id=>setCharacterId(id)};
  },[catalog,character,selection,mode,context,activeCase]);
  if(error)return <main><h1>Fashion 部件验收台</h1><p>{error}</p><p>请先生成本地原生与 AI 部件目录。</p></main>;
  if(!catalog||!selection)return <main><p>正在载入 Fashion 部件……</p></main>;
  const reviewMatches=reviews.protocol==='fashion-react-mix-98-90-v2'&&reviews.nativeHash===catalog.nativeHash&&reviews.round===catalog.reviewSession.round&&reviews.characters?.[character.id]?.inputHash===character.inputHash&&reviews.characters?.[character.id]?.renderModelHash===catalog.renderModelHash;
  const score=reviewMatches&&actualCase?reviews.cases?.[actualCase.id]:null;
  const characterScore=reviewMatches?reviews.characters?.[character.id]:null;
  const chosen=sourceOf(slot,selection,character);
  const aiCount=Object.entries(selection).filter(([id,value])=>value===AI&&catalog.slots.some(s=>s.id===id)).length;
  const native=nativeBaseline(catalog,selection,context);
  function chooseCandidate(slot,value){
    const reference=nativeSelection(catalog,context),next={...selection,[slot.id]:value};
    if(!next.__pose||next.__pose==='standard'){next.__pose=reference.__pose;next.__targetGeometryHash=reference.__targetGeometryHash;next.__context=context;}
    const bodySlot=catalog.slots.find(item=>item.id==='body');
    if(slot.id==='body'&&value!==AI){next.__pose=bodySlot.native[value].id;next.__targetGeometryHash=bodySlot.native[value].geometryHash;delete next['body.mode'];}
    if(slot.group==='anatomy'){const index=bodySlot.native.findIndex(item=>item.id===next.__pose);next.body=index>=0?index:reference.body;next['body.mode']='parts';}
    setSelection(next);setMode('mixed');
  }
  function changeContext(index){const next=nativeSelection(catalog,index);for(const item of catalog.slots)if(selection[item.id]===AI)next[item.id]=AI;if(selection['body.mode']==='parts'||catalog.slots.some(item=>item.group==='anatomy'&&selection[item.id]===AI))next['body.mode']='parts';setContext(index);setSelection(next);setMode(mode==='study'?'study':'mixed');}
  function changeRound(value){if(!rounds.some(item=>String(item.round)===value))return;const url=new URL(location.href);url.searchParams.set('round',value);url.searchParams.delete('case');location.assign(url);}
  function changeCharacter(id){setCharacterId(id);setCaseIndex(0);const url=new URL(location.href);url.searchParams.delete('case');url.searchParams.set('character',id);history.replaceState(null,'',url);}
  return <main>
    <header><div className="brand">秀</div><div><p className="eyebrow">FASHION QQ SHOW / COMPONENT REVIEW</p><h1>部件混搭验收台</h1><p>原生校准 · 独立评分 · 按部件返修</p></div><div className="requirements"><span>融合度 <b>98+</b></span><span>立绘还原 <b>90+</b></span></div></header>
    <p><a href="/workplace/LLM-show-fashion/results/index.html">结果与评分总览</a> · <a href="/workplace/LLM-show-fashion/results/newest/index.html">newest 最新</a> · <a href="/workplace/LLM-show-fashion/results/new/index.html">new 上一版</a> · <a href="/workplace/LLM-show-fashion/results/previous/index.html">previous 前两版</a> · <a href="/workplace/LLM-show-fashion/rating-rules/SCORING.md">评分规则</a>　下方轮次选择保留历史复查入口。</p>
    <nav className="characters" aria-label="角色">{catalog.characters.map(c=><button key={c.id} aria-pressed={c.id===character.id} onClick={()=>changeCharacter(c.id)}>{c.name}<span className={c.ready?'ready':'pending'}>{c.ready?'可评审':'制作中'}</span></button>)}</nav>
    <section className="window"><div className="bar"><h2>独立工作区</h2><label>评审轮次 <select aria-label="评审轮次" value={catalog.reviewSession.round} onChange={e=>changeRound(e.target.value)}>{(rounds.length?rounds:[{round:catalog.reviewSession.round}]).map(item=><option key={item.round} value={item.round}>第 {item.round} 轮</option>)}</select></label><span>{catalog.revision}</span></div><div className="toolbar"><div><button aria-pressed={mode==='mixed'} onClick={()=>setMode('mixed')}>① 原生混搭</button><button aria-pressed={mode==='identity'} onClick={()=>{setMode('identity');setSelection(aiSelection(catalog));}}>② 全套立绘还原</button><button aria-pressed={mode==='study'} onClick={()=>setMode('study')}>③ 标准姿态素体</button></div><div>原生上下文 {Array.from({length:5},(_,i)=><button key={i} aria-pressed={context===i} onClick={()=>changeContext(i)}>{i+1}</button>)}</div><div>{[['paper','浅底'],['dark','深底'],['checker','透明格']].map(([id,label])=><button key={id} aria-pressed={background===id} onClick={()=>setBackground(id)}>{label}</button>)}</div></div>
      <div className="workspace"><aside><h3>组件</h3><div className="slot-list">{catalog.slots.map(s=><button key={s.id} className={s.group==='anatomy'?'child':''} aria-pressed={selectedSlot===s.id} onClick={()=>setSelectedSlot(s.id)}><span>{s.label}</span><i>{selection[s.id]===AI?'AI':selection[s.id]==='none'?'—':`N${(selection[s.id]??0)+1}`}</i></button>)}</div><button className="wide" onClick={()=>{setSelection(nativeSelection(catalog,context));setMode('mixed');}}>全部还原生 · 100 分校准</button></aside>
      <div className="comparisons">{mode==='study'?<><figure><figcaption><b>原生素体 · 当前上下文</b><span className="score native">100 <small>用户定义基准</small></span></figcaption><Mannequin catalog={catalog} character={character} selection={native} background={background}/></figure><figure><figcaption><b>{character.name} · 标准立绘姿态素体</b><span className="score">{characterScore?.standardBody?.integrationScore??'待独立评审'}</span></figcaption><Mannequin catalog={catalog} character={character} selection={selection} background={background} standard/></figure></>:mode==='mixed'?<><figure><figcaption><b>原生组合</b><span className="score native">100 <small>用户定义基准</small></span></figcaption><Composite catalog={catalog} character={character} selection={native} background={background}/></figure><figure><figcaption><b>{character.name} · 含 AI 部件</b><span className="score">{score?.integrationScore??'待独立评审'}</span></figcaption><Composite catalog={catalog} character={character} selection={selection} background={background}/></figure></>:<><figure><figcaption><b>标准比例立绘</b></figcaption><div className="reference"><img src={character.reference} alt={character.name+' 标准立绘'}/></div></figure><figure><figcaption><b>{character.name} · 全套 AI</b><span className="score">{characterScore?.identityScore??'待独立评审'}</span></figcaption><Composite catalog={catalog} character={character} selection={aiSelection(catalog)} background={background}/></figure></>}</div></div>
      <div className="casebar"><div><strong>{mode==='study'?'标准立绘姿态完整素体 · 独立验收':actualCase?.id||(aiCount?'自定义混搭 · 尚未编号评分':'全部原生 · 100 分校准')}</strong><span>{mode==='study'?'同版本标准身体 + 裸掌 + 头脸 · 使用完整标准姿态':`${aiCount} 个 AI 选项 · ${Object.entries(selection).filter(([,v])=>v===AI).map(([id])=>id).join(' + ')||'全部原生'}`}</span></div><select aria-label="组合类型" value={caseFilter} onChange={e=>{setCaseFilter(e.target.value);setCaseIndex(0);}}><option value="single">单组件 × 五种原生上下文</option><option value="multi">原生 + 多个 AI 部件</option><option value="pair">相邻组件接合</option><option value="all-ai">全套 AI</option></select><button onClick={()=>{const i=(caseIndex-1+filteredCases.length)%filteredCases.length;setCaseIndex(i);applyCase(filteredCases[i]);}}>← 上一组合</button><button onClick={()=>{const i=(caseIndex+1)%filteredCases.length;setCaseIndex(i);applyCase(filteredCases[i]);}}>下一组合 →</button><button onClick={()=>{const item=filteredCases[caseIndex%filteredCases.length];if(item)applyCase(item);}}>载入此组合</button></div>
    </section>
    <ReviewHistory catalog={catalog} rounds={rounds}/>
    {mode==='study'&&<StandardEvidence character={character} standardBody={characterScore?.standardBody} lookBank={lookBank?.nativeHash===catalog.nativeHash?lookBank:null}/>}
    <section className="window"><div className="bar"><h2>{slot.label} · {slot.native.length} 原生 + 1 AI</h2><span>当前：{chosen?.label||'尚未生成'}</span></div><div className="candidates">{[...(catalog.reviewSession.contextPolicy?.optionalOmitted?.includes(slot.id)?[{id:'none',label:'不佩戴',omitted:true}]:[]),...slot.native.map((candidate,index)=>({...candidate,nativeIndex:index})),{id:'ai',label:character.name+' / 本轮部件',src:sourceOf(slot,{...selection,[slot.id]:AI},character)?.src,ai:true}].map((candidate,i)=>{const value=candidate.ai?AI:candidate.omitted?'none':candidate.nativeIndex;return <button key={candidate.id||i} aria-pressed={selection[slot.id]===value} onClick={()=>{chooseCandidate(slot,value);}}><div className={'candidate '+background}>{candidate.src?<img src={candidate.src} alt={candidate.label}/>:<span>{candidate.omitted?'不佩戴':'制作中'}</span>}</div><strong>{candidate.ai?'AI':candidate.omitted?'—':`N${candidate.nativeIndex+1}`} · {candidate.label}</strong><small>{candidate.note||candidate.sources?.join(' + ')||'同一画布、独立语义组件'}</small></button>;})}</div></section>
    <section className="window"><div className="bar"><h2>独立评审与返修</h2><span>分数只来自已看过当前文件的评审</span></div><div className="judgement"><p><b>① 融合度</b>：轮廓与体块、笔触与材质、明暗与效果、比例、接合连续性；至少 98。单件、多AI混搭及相邻接合均须评；五种上下文分别评，采用最低分。</p><p><b>② 立绘还原</b>：动作、姿态、神态、刘海发型、服饰轮廓、标志配饰和对应部位色相；至少 90。只核对色相是否相近，不因具体色号、明暗或饱和度不同扣颜色分。结合标准立绘与对应角色 Markdown 设定，分别验收。</p><p>{score?.reason||'该混搭尚无新协议下的独立评分；旧素体分和渲染检查均不会代替此次验收。'}</p>{characterScore&&<p><b>本轮独立评审：</b>融合最低 {characterScore.integrationScore} / 98，整套还原 {characterScore.identityScore} / 90。{characterScore.accepted?'已通过本轮完整验收。':'未通过，继续返修；未审案例不视为通过。'} 已评分 {characterScore.scoredCaseCount??characterScore.coverage?.viewedCount??0} / {characterScore.plannedCaseCount??characterScore.coverage?.plannedCount??246}。 <a href={characterScore.report} target="_blank" rel="noopener">评分原文 ↗</a></p>}{score&&<p><a href={score.nativeEvidence} target="_blank" rel="noopener">本案例原生100组合 ↗</a> · <a href={score.evidence} target="_blank" rel="noopener">本案例AI混搭 ↗</a></p>}{character.referenceNotes&&<p><a href={character.referenceNotes} target="_blank" rel="noopener">{character.name} · 角色设定原文 ↗</a></p>}<p><b>③ 标准姿态素体</b>：另与原生躯体和20个原SWF逐一并排看图，融合至少98，动作须与标准立绘神似；素体或四肢姿态有非常显著差异须扣分。姿态兼容件的高分不能代替此项。{characterScore?.standardBody?.image&&<> <a href={characterScore.standardBody.image} target="_blank" rel="noopener">标准素体对照图 ↗</a></>}{characterScore?.standardBody?.report&&<> · <a href={characterScore.standardBody.report} target="_blank" rel="noopener">素体独立评分 ↗</a></>}</p><a href="/workplace/LLM-show-fashion/rating-rules/SCORING.md" target="_blank" rel="noopener">查看样本、组合与验收规则 ↗</a></div></section>
    <footer>仅使用本地 Fashion 原件与派生部件。原生组合 100 分是校准定义；所有 AI 分数须附独立看图证据、扣分理由及返修轮次。</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
