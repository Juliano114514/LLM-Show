import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEY = 'ai-show-wardrobe-classic-v2';
const COLLECTION_KEY = 'ai-show-collection-classic-v2';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SLOT_ICONS = { background: 'scene', aura: 'sparkle', back: 'wing', hair: 'hair', legs: 'boot', bottom: 'skirt', top: 'shirt', face: 'smile', headwear: 'crown', prop: 'wand', effect: 'sparkle' };
const FALLBACK_CROPS = {
  hair: [25, 25, 90, 110], face: [42, 42, 58, 54], headwear: [30, 20, 80, 72],
  top: [24, 78, 95, 76], bottom: [27, 117, 87, 78], legs: [34, 148, 73, 72],
  prop: [0, 55, 140, 155], back: [8, 57, 124, 142], aura: [0, 0, 140, 226],
};

function Icon({ name = 'sparkle', size = 18, ...props }) {
  const paths = {
    sparkle: <><path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" /><path d="m20 2 .7 1.3L22 4l-1.3.7L20 6l-.7-1.3L18 4l1.3-.7Z" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M4 16v5h16v-5" /></>,
    random: <><path d="M3 5h3l12 14h3m-4-4 4 4-4 4M3 19h3l4-5m4-4 4-5h3m-4-4 4 4-4 4" /></>,
    reset: <><path d="M3 10a9 9 0 1 1 2 8M3 3v7h7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    shirt: <path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4c0 4-8 4-8 0Z" />,
    skirt: <><path d="M8 3h8l5 18H3L8 3Z" /><path d="M7 7h10m-6 0-2 14m4-14 2 14" /></>,
    hair: <><path d="M5 21V10a7 7 0 0 1 14 0v11M8 20v-8l4-6 4 6v8" /><path d="M4 17H2m18 0h2" /></>,
    smile: <><circle cx="12" cy="12" r="9" /><path d="M8 9h.01M16 9h.01M7.5 14a5 5 0 0 0 9 0" /></>,
    crown: <><path d="m3 6 5 4 4-7 4 7 5-4-3 14H6L3 6Z" /><path d="M6 16h12" /></>,
    wand: <><path d="m4 21 10-10m0-8 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" /><path d="m5 3 1 2m14 12 1 2" /></>,
    boot: <path d="M7 3h8v11l5 3v4H4v-7h3V3Z" />,
    wing: <><path d="M12 20C5 18 2 12 3 4c3 1 5 4 6 7l3 2m0 7c7-2 10-8 9-16-3 1-5 4-6 7l-3 2Z" /><path d="M12 13v7" /></>,
    scene: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="2" /><path d="m3 19 6-7 4 4 3-5 5 8" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v7m0-11h.01" /></>,
    undo: <><path d="m8 3-5 5 5 5M3 8h11a7 7 0 0 1 0 14" /></>,
    code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.sparkle}</svg>;
}

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function getLayers(manifest, selection, excludeBackground = false) {
  const itemsById = new Map(manifest.items.map((item) => [item.id, item]));
  return manifest.slots.flatMap((slot) => {
    if (excludeBackground && slot.id === 'background') return [];
    const item = itemsById.get(selection[slot.id]);
    if (!item || item.slot !== slot.id) return [];
    return (item.layers?.length ? item.layers : [{ src: item.src, svg: item.svg, z: slot.z }])
      .filter((layer) => Boolean(layer.src))
      .map((layer, index) => ({ ...layer, z: layer.z ?? slot.z, key: `${item.id}-${index}`, itemId: item.id, name: item.name, slot: slot.id }));
  }).sort((a, b) => a.z - b.z);
}

function validSelection(manifest, raw, fallback) {
  return Object.fromEntries(manifest.slots.map((slot) => {
    const id = raw?.[slot.id];
    const item = manifest.items.find((candidate) => candidate.id === id && candidate.slot === slot.id);
    return [slot.id, item ? id : slot.optional && id === null ? null : fallback[slot.id] ?? null];
  }));
}

function presetFor(manifest, ownerId) {
  return ownerId === 'base' ? manifest.basePreset : (manifest.characters.find((entry) => entry.id === ownerId) || manifest.characters[0]).preset;
}

function sourceName(manifest, item) {
  return manifest.characters.find((entry) => entry.id === item.characterId)?.name || item.sourceLabel || '原版 default';
}

function appendSvgLayer(document, target, markup, layer, index) {
  const source = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = source.documentElement;
  if (source.querySelector('parsererror') || root.localName !== 'svg' || root.namespaceURI !== SVG_NAMESPACE) throw new Error(`「${layer.name}」的 SVG 无法读取`);
  if (root.querySelector('image, script, foreignObject')) throw new Error(`「${layer.name}」包含非路径内容，无法导出可编辑 SVG`);
  const ids = new Map();
  const nodes = [root, ...root.querySelectorAll('*')];
  nodes.forEach((node) => { if (node.id) ids.set(node.id, `layer${index}-${node.id}`); });
  const references = (value) => value.replace(/url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g, (match, quote, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
  nodes.forEach((node) => {
    for (const attribute of [...node.attributes]) {
      if (attribute.name === 'id') attribute.value = ids.get(attribute.value);
      else if ((attribute.localName === 'href') && attribute.value.startsWith('#') && ids.has(attribute.value.slice(1))) attribute.value = `#${ids.get(attribute.value.slice(1))}`;
      else attribute.value = references(attribute.value);
    }
    if (node.localName === 'style') node.textContent = references(node.textContent);
  });
  const group = document.createElementNS(SVG_NAMESPACE, 'g');
  group.setAttribute('data-slot', layer.slot);
  group.setAttribute('data-item', layer.itemId);
  group.setAttribute('data-z', layer.z);
  for (const attribute of [...root.attributes]) {
    if (!['xmlns', 'width', 'height', 'viewBox'].includes(attribute.name) && attribute.prefix !== 'xmlns') group.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
  }
  for (const child of [...root.childNodes]) group.appendChild(document.importNode(child, true));
  target.appendChild(group);
}

function Doll({ layers, className = '', label = '', style = {} }) {
  return <div className={`doll ${className}`} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={!label || undefined} style={style}>
    {layers.map((layer) => <img key={layer.key} src={layer.src} alt="" draggable="false" style={{ zIndex: layer.z }} />)}
  </div>;
}

function ItemPreview({ item, slot, canvas }) {
  const crop = item.thumbnailCrop || slot.thumbnailCrop;
  const view = crop ? [crop.left, crop.top, crop.width, crop.height] : FALLBACK_CROPS[slot.id] || [0, 0, canvas.width, canvas.height];
  const layers = item.layers?.length ? [...item.layers].sort((a, b) => (a.z ?? 0) - (b.z ?? 0)) : [{ src: item.src }];
  return <svg className="item-preview" viewBox={view.join(' ')} aria-hidden="true">
    {layers.map((layer, index) => <image key={index} href={layer.src} width={canvas.width} height={canvas.height} />)}
  </svg>;
}

function App() {
  const [manifest, setManifest] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [characterId, setCharacterId] = useState('gpt');
  const [selection, setSelection] = useState({});
  const [category, setCategory] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState('wardrobe');
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  const [lookName, setLookName] = useState('');
  const [collection, setCollection] = useState([]);
  const [exportBusy, setExportBusy] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [history, setHistory] = useState([]);
  const [showEffects, setShowEffects] = useState(true);
  const [storageReady, setStorageReady] = useState(true);
  const dialogRef = useRef(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/assets-classic/manifest.json', { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('资源清单暂时无法读取'); return response.json(); })
      .then((data) => {
        if (!data.characters?.length || !data.slots?.length || !Array.isArray(data.items)) throw new Error('资源清单不完整');
        const saved = readStorage(STORAGE_KEY, null);
        const chosenCharacter = data.characters.find((character) => character.id === saved?.characterId) || data.characters[0];
        const chosenId = saved?.characterId === 'base' && data.basePreset ? 'base' : chosenCharacter.id;
        const chosenPreset = presetFor(data, chosenId);
        setCharacterId(chosenId);
        setSelection(validSelection(data, saved?.selection || chosenPreset, chosenPreset));
        const savedCollection = readStorage(COLLECTION_KEY, []);
        setCollection((Array.isArray(savedCollection) ? savedCollection : []).filter((look) => look && typeof look.name === 'string' && look.selection && typeof look.selection === 'object').slice(0, 12));
        setManifest(data);
      })
      .catch((error) => { if (error.name !== 'AbortError') setLoadError(error.message); });
    return () => { controller.abort(); clearTimeout(toastTimer.current); };
  }, []);

  useEffect(() => {
    if (manifest) setStorageReady(writeStorage(STORAGE_KEY, { characterId, selection }));
  }, [manifest, characterId, selection]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal && dialog && !dialog.open) dialog.showModal();
    if (!modal && dialog?.open) dialog.close();
  }, [modal]);

  const character = manifest?.characters.find((entry) => entry.id === characterId) || manifest?.characters[0];
  const layers = useMemo(() => manifest ? getLayers(manifest, selection).filter((layer) => showEffects || layer.slot !== 'effect') : [], [manifest, selection, showEffects]);
  const itemMap = useMemo(() => new Map(manifest?.items.map((item) => [item.id, item]) || []), [manifest]);
  const slotMap = useMemo(() => new Map(manifest?.slots.map((slot) => [slot.id, slot]) || []), [manifest]);
  const selectedCount = Object.values(selection).filter(Boolean).length;
  const isBase = characterId === 'base';
  const lookLabel = isBase ? '原版 default' : character?.name;
  const isMixed = manifest && manifest.slots.some((slot) => selection[slot.id] && itemMap.get(selection[slot.id])?.characterId !== characterId);
  const filteredItems = useMemo(() => manifest?.items.filter((item) =>
    (category === 'all' || item.slot === category) &&
    (ownerFilter === 'all' || item.characterId === ownerFilter) &&
    (!search.trim() || `${item.name} ${item.description || ''} ${slotMap.get(item.slot)?.label || ''} ${sourceName(manifest, item)}`.toLowerCase().includes(search.trim().toLowerCase()))
  ) || [], [manifest, category, ownerFilter, search, slotMap]);

  function remember() { setHistory((past) => [...past.slice(-29), { characterId, selection }]); }
  function selectItem(slotId, itemId) { remember(); setSelection((current) => ({ ...current, [slotId]: itemId })); }
  function chooseCharacter(next) {
    remember();
    setCharacterId(next.id);
    setSelection(validSelection(manifest, next.preset, next.preset));
    notify(`已穿上 ${next.name} 的完整套装`);
  }
  function reset() {
    remember();
    const preset = presetFor(manifest, characterId);
    setSelection(validSelection(manifest, preset, preset));
    notify('已经恢复角色原始搭配');
  }
  function chooseBase() {
    remember();
    setCharacterId('base');
    setSelection(validSelection(manifest, manifest.basePreset, manifest.basePreset));
    setModal(null);
    notify('已穿回原版 default 经典底板');
  }
  function randomize() {
    remember();
    setSelection(Object.fromEntries(manifest.slots.map((slot) => {
      const choices = manifest.items.filter((item) => item.slot === slot.id);
      return [slot.id, slot.optional && Math.random() < .12 ? null : choices[Math.floor(Math.random() * choices.length)]?.id ?? character.preset[slot.id] ?? null];
    })));
    notify('叮！今天的灵感搭配已送达');
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setCharacterId(previous.characterId);
    setSelection(previous.selection);
    setHistory((past) => past.slice(0, -1));
    notify('已撤销上一次换装');
  }
  function saveLook(event) {
    event.preventDefault();
    const next = [{ id: Date.now().toString(36), name: lookName.trim() || `${lookLabel} 的灵感搭配`, characterId, selection: { ...selection } }, ...collection].slice(0, 12);
    if (!writeStorage(COLLECTION_KEY, next)) { notify('浏览器空间不足，未能保存搭配'); return; }
    setCollection(next);
    setModal(null);
    setLookName('');
    notify('搭配已收进「我的收藏」');
  }
  function loadLook(look) {
    const owner = manifest.characters.find((entry) => entry.id === look.characterId) || character;
    const ownerId = look.characterId === 'base' ? 'base' : owner.id;
    const preset = presetFor(manifest, ownerId);
    remember();
    setCharacterId(ownerId);
    setSelection(validSelection(manifest, look.selection, preset));
    notify(`已穿上「${look.name}」`);
  }
  function deleteLook(id) {
    const next = collection.filter((look) => look.id !== id);
    if (!writeStorage(COLLECTION_KEY, next)) { notify('收藏更新失败，请稍后重试'); return; }
    setCollection(next);
    notify('已移除这套收藏');
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function exportRecipe() {
    download(new Blob([JSON.stringify({ format: 'ai-show-look', version: 2, poseFamily: manifest.poseFamily, characterId, selection, canvas: manifest.canvas }, null, 2)], { type: 'application/json' }), `${characterId}-classic-look.json`);
    notify('搭配清单已导出');
  }
  async function exportPng() {
    if (exportBusy) return;
    setExportBusy(true);
    try {
      const exportLayers = getLayers(manifest, selection, transparent).filter((layer) => showEffects || layer.slot !== 'effect');
      const pictures = await Promise.all(exportLayers.map((layer) => new Promise((resolve, reject) => {
        const picture = new Image();
        const timeout = setTimeout(() => reject(new Error(`「${layer.name}」加载超时，请重试`)), 12000);
        picture.onload = () => { clearTimeout(timeout); resolve(picture); };
        picture.onerror = () => { clearTimeout(timeout); reject(new Error(`无法读取「${layer.name}」`)); };
        picture.src = layer.src;
      })));
      const canvas = document.createElement('canvas');
      canvas.width = manifest.canvas.width * 3;
      canvas.height = manifest.canvas.height * 3;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('浏览器不支持画布导出');
      context.imageSmoothingEnabled = false;
      pictures.forEach((picture) => context.drawImage(picture, 0, 0, canvas.width, canvas.height));
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('图片导出失败，请重新尝试');
      download(blob, `${characterId}-${transparent ? 'transparent' : 'show'}-${Date.now()}.png`);
      notify(`QQ 秀已导出 · ${canvas.width} × ${canvas.height} PNG`);
      setModal(null);
    } catch (error) { notify(error.message); }
    finally { setExportBusy(false); }
  }

  async function exportSvg() {
    if (exportBusy) return;
    setExportBusy(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const exportLayers = getLayers(manifest, selection, transparent).filter((layer) => showEffects || layer.slot !== 'effect');
      const sources = await Promise.all(exportLayers.map(async (layer) => {
        if (!layer.svg) throw new Error(`「${layer.name}」没有可编辑 SVG 源文件`);
        const response = await fetch(layer.svg, { signal: controller.signal });
        if (!response.ok) throw new Error(`无法读取「${layer.name}」的 SVG`);
        return response.text();
      }));
      const output = document.implementation.createDocument(SVG_NAMESPACE, 'svg', null);
      const root = output.documentElement;
      root.setAttribute('width', manifest.canvas.width);
      root.setAttribute('height', manifest.canvas.height);
      root.setAttribute('viewBox', `0 0 ${manifest.canvas.width} ${manifest.canvas.height}`);
      root.setAttribute('shape-rendering', 'crispEdges');
      const title = output.createElementNS(SVG_NAMESPACE, 'title');
      title.textContent = `${lookLabel} · 可编辑 QQ 秀装扮`;
      root.appendChild(title);
      const metadata = output.createElementNS(SVG_NAMESPACE, 'metadata');
      metadata.textContent = JSON.stringify({ version: 2, poseFamily: manifest.poseFamily, characterId, selection, transparent, showEffects });
      root.appendChild(metadata);
      exportLayers.forEach((layer, index) => appendSvgLayer(output, root, sources[index], layer, index));
      const markup = new XMLSerializer().serializeToString(output);
      download(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), `${characterId}-classic-editable.svg`);
      notify('可编辑 SVG 已导出 · 每个部位保留独立路径分组');
      setModal(null);
    } catch (error) { notify(error.name === 'AbortError' ? 'SVG 资源加载超时，请重试' : error.message); }
    finally { clearTimeout(timeout); setExportBusy(false); }
  }

  if (!manifest) return <div className="loading-screen"><div className="loading-star">✦</div><h1>AI SHOW</h1><p>{loadError || '正在打开你的像素衣橱…'}</p>{loadError && <button className="button primary" onClick={() => location.reload()}>重新加载</button>}</div>;

  return <div className="app-shell" style={{ '--character-color': isBase ? '#8d849b' : character.color || '#aa94d0', '--character-accent': isBase ? '#eeeaf1' : character.accent || '#eee9f8' }}>
    <header className="site-header">
      <a href="#" className="brand" aria-label="AI SHOW 首页"><span className="brand-mark">✦</span><span>AI <b>SHOW</b><small>DRESS UP YOUR INTELLIGENCE</small></span></a>
      <nav className="header-nav" aria-label="主要导航"><button className={panel === 'wardrobe' ? 'active' : ''} onClick={() => setPanel('wardrobe')}>换装工作室</button><button className={panel === 'collection' ? 'active' : ''} onClick={() => setPanel('collection')}>我的收藏 <span>{collection.length.toString().padStart(2, '0')}</span></button></nav>
      <div className="header-right"><span className="online-dot" /> 灵感在线 <button className="icon-button about-button" aria-label="关于项目" onClick={() => setModal('about')}><Icon name="info" /></button></div>
    </header>

    <main>
      <section className="intro"><div><p className="eyebrow"><span /> THE INTERNET IS CUTE AGAIN</p><h1>给 AI 娘，换个<span>心情。<svg viewBox="0 0 120 9" aria-hidden="true"><path d="M2 6Q55 0 118 5" /></svg></span><i>✧</i></h1><p className="intro-description">熟悉的像素，小小的宇宙。把你的 AI 灵感，穿在身上。</p></div><div className="intro-stamp"><span>HELLO,</span><b>new look!</b><i>✦</i></div></section>

      <section className="character-selector" aria-label="选择角色整套装扮">
        {manifest.characters.map((entry, index) => <button key={entry.id} className={`character-card ${entry.id === characterId ? 'selected' : ''}`} onClick={() => chooseCharacter(entry)} aria-pressed={entry.id === characterId} style={{ '--card-color': entry.color, '--card-accent': entry.accent }}>
          <span className="character-number">0{index + 1}</span><span className="character-portrait"><img src={entry.portrait || entry.preview} alt="" /></span><span className="character-copy"><b>{entry.name}</b><small>{entry.title}</small></span><span className="character-choice">{entry.id === characterId ? <Icon name="check" size={13} /> : '↗'}</span>
        </button>)}
      </section>

      <div className="base-reference-bar"><p><span className="tiny-square" /> 原生 default 站姿 <small>140 × 226 · 同尺寸混穿</small></p><div><button className="button compare-default-button" onClick={() => setModal('compare')}><Icon name="grid" size={15} /> 与 default 对照</button><button className="button" onClick={chooseBase}><Icon name="reset" size={14} /> 穿回原版 default</button></div></div>

      <div className="workspace">
        <section className="preview-window window">
          <div className="window-bar"><span><span className="tiny-square" /> 我的 QQ 秀 <small>MY LITTLE UNIVERSE</small></span><div className="window-controls" aria-hidden="true"><i>−</i><i>□</i><i>×</i></div></div>
          <div className={`preview-heading ${isBase ? 'is-base' : ''}`}><div><span className="mini-label">NOW DRESSING</span><h2>{lookLabel}<span>{isMixed ? '自由混搭' : isBase ? '经典底板' : '原生套装'}</span></h2></div><button className="icon-button" onClick={() => { setLookName(`${lookLabel} 的灵感搭配`); setModal('save'); }} aria-label="收藏当前搭配"><Icon name="heart" size={21} /></button></div>
          <div className={`stage ${showEffects ? 'with-motion' : ''}`}><div className="stage-corners" aria-hidden="true"><i /><i /><i /><i /></div><span className="stage-label">AI SHOW / 2000 → NOW</span><Doll layers={layers} className="main-doll" label={`${lookLabel} 当前装扮，共 ${selectedCount} 个部件`} /><span className="stage-sticker" aria-hidden="true">made of<br /><b>little dreams</b> ✦</span><span className="stage-coordinate" aria-hidden="true">140 × 226 px</span></div>
          <div className="preview-caption"><span className="status-spark">✦</span><span>{isMixed ? '原库与新绘部件共用同一站姿，可以逐件混穿。' : isBase ? '原版 default 的脸、身形和站姿，保留最初的像素。' : character.description}</span></div>
          <div className="stage-toolbar"><button onClick={randomize} className="button"><Icon name="random" size={16} /> 随机灵感</button><button onClick={undo} disabled={!history.length} className="button square" aria-label="撤销上一步"><Icon name="undo" size={16} /></button><button onClick={reset} className="button square" aria-label="恢复原始套装"><Icon name="reset" size={16} /></button><button onClick={() => setShowEffects((enabled) => !enabled)} className={`button square effects-toggle ${showEffects ? 'enabled' : ''}`} aria-label={showEffects ? '隐藏闪效' : '显示闪效'} aria-pressed={showEffects}><Icon name="sparkle" size={16} /></button></div>
          <button className="button primary export-button" onClick={() => setModal('export')}><Icon name="download" size={17} /> 导出我的 QQ 秀 <span>PNG / SVG ↗</span></button>
          <p className="autosave-note"><span className="online-dot" /> {storageReady ? '装扮自动保存在此浏览器' : '浏览器存储不可用，请导出搭配清单'}</p>
        </section>

        <section className="wardrobe-window window" aria-label={panel === 'wardrobe' ? '部件衣橱' : '我的收藏'}>
          <div className="window-bar wardrobe-bar"><span><span className="tiny-square" /> {panel === 'wardrobe' ? '灵感衣橱' : '我的收藏'} <small>{panel === 'wardrobe' ? 'THE WARDROBE' : 'SAVED LITTLE DREAMS'}</small></span><span className="window-counter">{panel === 'wardrobe' ? `${manifest.items.length} ITEMS` : `${collection.length} LOOKS`}</span></div>
          {panel === 'wardrobe' ? <>
            <div className="wardrobe-heading"><div><h2>一件一件，拼出你的喜欢 <span>✧</span></h2><p>点击即试穿 · {manifest.characters.length} 位 AI 娘的衣橱随你搭</p></div><span className="new-label">MIX & MATCH</span></div>
            <div className="wardrobe-tools"><div className="search-box"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="找一件喜欢的单品…" aria-label="搜索部件名称" />{search && <button aria-label="清除搜索" onClick={() => setSearch('')}><Icon name="close" size={13} /></button>}</div><select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} aria-label="按角色筛选单品"><option value="all">全部角色</option>{manifest.characters.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}<option value="base">原版 default</option></select></div>
            <div className="category-tabs" role="group" aria-label="部件分类"><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')} aria-pressed={category === 'all'}><Icon name="grid" size={15} /> 全部</button>{manifest.slots.map((slot) => <button key={slot.id} className={category === slot.id ? 'active' : ''} onClick={() => setCategory(slot.id)} aria-pressed={category === slot.id}><Icon name={SLOT_ICONS[slot.id]} size={15} />{slot.label}</button>)}</div>
            <div className="item-list-head"><span>{category === 'all' ? '全部单品' : slotMap.get(category)?.label} <b>{filteredItems.length.toString().padStart(2, '0')}</b></span><span><i /> 已穿戴 {selectedCount} 件</span></div>
            <div className="item-grid" key={`${category}-${ownerFilter}`}>
              {category !== 'all' && slotMap.get(category)?.optional && <button className={`item-card none-card ${!selection[category] ? 'worn' : ''}`} onClick={() => selectItem(category, null)} aria-pressed={!selection[category]}><div className="item-image"><span>∅</span></div><div className="item-copy"><b>不佩戴</b><small>让造型轻一点</small></div>{!selection[category] && <span className="worn-check"><Icon name="check" size={11} /></span>}</button>}
              {filteredItems.map((item) => { const slot = slotMap.get(item.slot); const owner = manifest.characters.find((entry) => entry.id === item.characterId); return <button key={item.id} className={`item-card ${selection[item.slot] === item.id ? 'worn' : ''}`} onClick={() => selectItem(item.slot, item.id)} aria-pressed={selection[item.slot] === item.id} aria-label={`试穿 ${item.name}，${sourceName(manifest, item)} ${slot?.label || ''}`} title={item.description || item.name} style={{ '--item-color': owner?.color || '#b8a4d4' }}><div className={`item-image slot-${item.slot}`}><span className="item-slot">{slot?.label}</span><ItemPreview item={item} slot={slot} canvas={manifest.canvas} />{item.rarity && <span className="rarity-badge">{item.rarity}</span>}</div><div className="item-copy"><b>{item.name}</b><small><i />{sourceName(manifest, item)}</small></div>{selection[item.slot] === item.id && <span className="worn-check"><Icon name="check" size={11} /></span>}</button>; })}
            </div>
            {!filteredItems.length && <div className="empty-state"><Icon name="search" size={32} /><h3>这件灵感还没被发现</h3><p>换个关键词，或看看其他角色的衣橱。</p><button className="button" onClick={() => { setSearch(''); setOwnerFilter('all'); setCategory('all'); }}>查看全部单品</button></div>}
            <div className="wardrobe-footnote"><Icon name="info" size={14} /><span>同一个部位会自动替换；发型的前后图层一起更换。</span><button onClick={exportRecipe} title="导出搭配 JSON"><Icon name="code" size={16} /><span>搭配清单</span></button></div>
          </> : <div className="collection-panel"><div className="collection-heading"><div><h2>把心动，收起来。</h2><p>最多保存 12 套，留给下一次的好心情。</p></div><button className="button" onClick={() => { setLookName(`${lookLabel} 的灵感搭配`); setModal('save'); }}><Icon name="heart" size={15} /> 保存当前</button></div>{collection.length ? <div className="look-grid">{collection.map((look) => <article className="look-card" key={look.id}><button onClick={() => loadLook(look)} aria-label={`穿上 ${look.name}`}><Doll layers={getLayers(manifest, validSelection(manifest, look.selection, presetFor(manifest, look.characterId)))} /><b>{look.name}</b><small>点击穿上这套搭配 ↗</small></button><button className="remove-look" onClick={() => deleteLook(look.id)} aria-label={`移除收藏 ${look.name}`}><Icon name="close" size={13} /></button></article>)}</div> : <div className="empty-state collection-empty"><span className="empty-heart">♡</span><h3>你的第一个心动造型，正在路上</h3><p>搭配完成后，点预览右上角的爱心收藏它。</p><button className="button primary" onClick={() => setPanel('wardrobe')}>去衣橱逛逛 <span>↗</span></button></div>}</div>}
        </section>
      </div>

      <section className="currently-wearing"><div className="wearing-label"><Icon name="shirt" size={17} /><span>正在穿戴</span><small>CURRENT LOOK</small></div><div className="wearing-items">{manifest.slots.filter((slot) => selection[slot.id]).map((slot) => <button key={slot.id} onClick={() => { setPanel('wardrobe'); setCategory(slot.id); setOwnerFilter('all'); setSearch(''); }} title={`查看${slot.label}`}><span>{slot.label}</span>{itemMap.get(selection[slot.id])?.name}<i>↗</i></button>)}</div></section>
    </main>

    <footer><span className="footer-brand">✦ AI SHOW</span><p>大模型的小小衣橱，和一点点互联网的浪漫。</p><button onClick={() => setModal('about')}>角色来源与制作说明 <span>↗</span></button><span className="footer-year">MADE WITH LITTLE PIXELS · 2026</span></footer>
    {toast && <div className="toast" role="status"><span>✦</span>{toast}</div>}
    <dialog ref={dialogRef} aria-labelledby="dialog-heading" onCancel={() => setModal(null)} onClick={(event) => { if (event.target === dialogRef.current) setModal(null); }} className={`app-dialog ${modal === 'compare' ? 'comparison-dialog' : ''}`}>
      <div className="dialog-title"><span id="dialog-heading">✦ {modal === 'save' ? '收藏这份灵感' : modal === 'export' ? '把 QQ 秀带走' : modal === 'compare' ? '与原版 default 同尺寸对照' : '关于这间小小衣橱'}</span><button className="icon-button" onClick={() => setModal(null)} aria-label="关闭窗口"><Icon name="close" size={17} /></button></div>
      {modal === 'save' ? <form onSubmit={saveLook} className="dialog-content">
        <label htmlFor="look-name">为这套搭配起个名字</label><input id="look-name" autoFocus maxLength={32} value={lookName} onChange={(event) => setLookName(event.target.value)} placeholder="今天，也是闪闪发光的一天" />
        <p className="muted">仅保存在当前浏览器。超过 12 套时替换最早的一套。</p><button type="submit" className="button primary"><Icon name="heart" size={16} /> 收进我的收藏</button>
      </form> : modal === 'export' ? <div className="dialog-content">
        <p>PNG 保留原生像素；SVG 按部位保留可编辑路径。</p>
        <div className="export-preview"><Doll layers={layers.filter((layer) => !transparent || layer.slot !== 'background')} /><span>{manifest.canvas.width * 3} × {manifest.canvas.height * 3}<br /><b>PNG / 透明度保留</b></span></div>
        <label className="checkbox-label"><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} />隐藏场景背景，导出透明底人物</label>
        <button className="button primary" onClick={exportPng} disabled={exportBusy}><Icon name="download" size={16} /> {exportBusy ? '正在整理导出文件…' : '下载我的 QQ 秀 PNG'}</button>
        <button className="button svg-export" onClick={exportSvg} disabled={exportBusy}><Icon name="code" size={16} /> 下载可编辑搭配 SVG</button>
        <p className="muted">SVG 使用 {manifest.canvas.width}×{manifest.canvas.height} 原生坐标，每个部件独立分组，可在矢量编辑器中继续调整。</p>
        <button className="button recipe-export" onClick={exportRecipe}><Icon name="code" size={16} /> 下载搭配清单 JSON</button>
      </div> : modal === 'compare' ? <div className="dialog-content comparison-content">
        <p>原版 default 与 {manifest.characters.length} 套新装共用 140×226 画布。脸、手臂、腰线和脚底沿用原生坐标。</p>
        <div className="comparison-image-scroll" tabIndex={0} aria-label={`原版 default 与 ${manifest.characters.length} 套形象对照图，可横向滚动`}><img src="/assets-classic/default-comparison.png" alt={`原版 default、${manifest.characters.map(c=>c.name).join('、')} 同尺寸并排对照`} /></div>
        <p className="muted">窄屏可左右滚动查看。也可以穿回原版，再逐件试穿新发型和服装。</p>
        <div className="comparison-actions"><button className="button primary" onClick={chooseBase}><Icon name="reset" size={15} /> 穿回原版 default</button><button className="button" onClick={() => setModal(null)}>继续换装</button></div>
      </div> : <div className="dialog-content about-content">
        <span className="about-logo">AI SHOW <i>✦</i></span>
        <p>新版直接以原库 default 为底板，保留脸型、身体比例、站姿与 140×226 原生坐标。各角色的眉眼和嘴角按本项目同人设定作轻度表情演绎；头发和服装用可编辑 SVG 重绘、调色，展示使用原生 PNG 像素，支持与原版部件混穿。</p>
        <p>角色主题参考本地 AI Girls Atlas 中 ZipZipPipe 的标准比例立绘，DeepSeek 原角色另署名上善无形。千问、Gemini、GLM 的所选原图沿用作者分享声明；历史版本使用的 ApprenTice 派生参考另按 CC BY-NC-SA 4.0 记录。</p>
        <p>本项目为非官方同人创作。原 QQ 秀底板与素材保留各自权利边界，不统一纳入角色派生许可；完整来源与使用条件见资源包署名文件。</p>
        <p className="muted">装扮与收藏存储在此浏览器。新版使用独立存储空间；PNG、SVG 都导出当前选中的静态可见部件。</p>
        <button className="button primary" onClick={() => setModal(null)}>继续我的灵感搭配 <span>↗</span></button>
      </div>}
    </dialog>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
