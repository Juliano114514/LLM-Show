const CHARACTERS = new Set(['gpt', 'deepseek', 'claude', 'grok', 'qwen', 'gemini', 'glm']);
const HASH = /^[a-f0-9]{64}$/;
const SVG_NS = 'http://www.w3.org/2000/svg';
const sheet = document.querySelector('#sheet');
const status = document.querySelector('#status');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const fatal = document.querySelector('#fatal');
const identity = document.querySelector('#identity');
const provenance = document.querySelector('#provenance');
let data;
let groups = [];
let currentGroup = 0;
let currentFocus = null;
let renderGeneration = 0;
const verifiedAssets = new Map();

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function integerParameter(value, name, minimum) {
  check(typeof value === 'string' && /^\d+$/.test(value), `${name} 必须是整数`);
  const number = Number(value);
  check(Number.isSafeInteger(number) && number >= minimum, `${name} 超出有效范围`);
  return number;
}

function sameOriginURL(value, prefix) {
  check(typeof value === 'string' && value.startsWith('/'), '只允许本站绝对资源路径');
  const url = new URL(value, location.origin);
  check(url.origin === location.origin && !url.search && !url.hash && url.pathname.startsWith(prefix), '资源不属于本轮允许的同源目录');
  return url.href;
}

async function digest(bytes) {
  const result = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readResource(url) {
  const response = await fetch(url, {credentials: 'same-origin', cache: 'no-store', redirect: 'error'});
  check(response.ok, `资源载入失败：${new URL(url).pathname} (${response.status})`);
  return response.arrayBuffer();
}

function readJSON(bytes, label) {
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error(`${label} 不是有效 JSON`); }
}

function assetURL(src) {
  return sameOriginURL(src, data.assetBase);
}

function registerHash(map, src, expected) {
  const url = sameOriginURL(src, data.assetBase);
  check(HASH.test(expected), `资源缺少 SHA：${new URL(url).pathname}`);
  check(!map.has(url) || map.get(url) === expected, '同一资源存在冲突的 SHA');
  map.set(url, expected);
}

async function verifyAsset(url) {
  if (!verifiedAssets.has(url)) {
    verifiedAssets.set(url, (async () => {
      const expected = data.assetHashes.get(url);
      check(HASH.test(expected || ''), `资源未登记在冻结输入中：${new URL(url).pathname}`);
      check(await digest(await readResource(url)) === expected, `图层 SHA 不匹配：${new URL(url).pathname}`);
    })());
  }
  return verifiedAssets.get(url);
}

function addImage(stage, src, pending, {reference = false, slot = '', origin = ''} = {}) {
  const url = src.startsWith(data.studyBase) ? sameOriginURL(src, data.studyBase + 'sources/') : assetURL(src);
  const img = element('img', reference ? 'layer reference' : 'layer');
  img.alt = '';
  img.loading = 'eager';
  img.decoding = 'sync';
  img.dataset.slot = slot;
  img.dataset.origin = origin;
  stage.append(img);
  pending.push((async () => {
    await verifyAsset(url);
    img.src = url;
    await img.decode();
    check(img.naturalWidth > 0 && img.naturalHeight > 0, '图层解码后没有有效尺寸');
  })());
}

function addTransformedImage(stage, layer, pending) {
  const url = assetURL(layer.src);
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'layer transformed-layer');
  svg.setAttribute('viewBox', '0 0 140 226');
  svg.dataset.slot = layer.key;
  svg.dataset.origin = layer.ai ? 'ai' : 'native';
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('transform', layer.transform);
  const image = document.createElementNS(SVG_NS, 'image');
  image.setAttribute('width', '140');
  image.setAttribute('height', '226');
  group.append(image);
  svg.append(group);
  stage.append(svg);
  // SVGImageElement has no decode(). Decode its href independently before ready.
  pending.push((async () => {
    await verifyAsset(url);
    const preload = new Image();
    preload.decoding = 'sync';
    preload.src = url;
    image.setAttribute('href', url);
    await preload.decode();
    check(preload.naturalWidth > 0, '鞋袜原图解码失败');
  })());
}

function stageFigure(label, layers, pending, {reference, scale = 2, stripY = null} = {}) {
  const figure = element('figure');
  figure.append(element('figcaption', '', label));
  const stage = element('div', reference ? 'stage reference-stage' : 'stage');
  stage.dataset.scale = String(scale);
  stage.dataset.layerCount = String(reference ? 1 : layers.length);
  if (stripY !== null) {
    stage.style.setProperty('--strip-y', stripY + 'px');
    Object.assign(stage.dataset, {stripY: String(stripY), stripEndExclusive: String(stripY + 452), sourceWidth: '840', sourceHeight: '1356'});
  }
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', label);
  if (reference) addImage(stage, reference, pending, {reference: true, origin: 'standard-reference'});
  else for (const layer of layers) {
    if (layer.transform) addTransformedImage(stage, layer, pending);
    else addImage(stage, layer.src, pending, {slot: layer.key, origin: layer.ai ? 'ai' : 'native'});
  }
  figure.append(stage);
  return figure;
}

function standardLayers() {
  return data.model.standardMannequinLayers(data.character).map(layer => ({...layer, ai: true}));
}

function nativeBodyLayers(context) {
  const selection = data.model.nativeSelection(data.catalog, context);
  return data.model.visualLayers(data.catalog, selection, data.character)
    .filter(layer => layer.key === 'body' || layer.key.startsWith('body.') || ['face', 'features', 'hands'].includes(layer.key));
}

function buildGroups(cases) {
  const result = [];
  const byKey = new Map();
  for (const entry of cases) {
    const key = entry.kind + ':' + entry.slot;
    if (!byKey.has(key)) {
      const group = {kind: entry.kind, name: `${entry.kind} · ${entry.slot}`, cases: []};
      byKey.set(key, group);
      result.push(group);
    }
    byKey.get(key).cases.push(entry);
  }
  check(result.length === 50, '混搭组数不是 50');
  const expected = {single: 21, pair: 10, multi: 18, 'all-ai': 1};
  for (const [kind, count] of Object.entries(expected)) check(result.filter(group => group.kind === kind).length === count, `${kind} 组数不一致`);
  for (const group of result) {
    check(group.cases.length === (group.kind === 'all-ai' ? 1 : 5), '组内案例数量不一致');
    if (group.kind !== 'all-ai') check(new Set(group.cases.map(entry => entry.context)).size === 5, '组内缺少原生上下文');
  }
  result.push({kind: 'standard-single', name: '标准 · 裸标准素体单图', standard: true, count: 1});
  result.push({kind: 'standard-native', name: '标准 · 五种原生素体对照', standard: true, count: 5});
  result.push({kind: 'standard-reference', name: '标准 · 立绘与裸标准素体', standard: true, count: 1});
  for (let page = 0; page < 4; page++) result.push({kind: 'standard-swf', name: `标准 · 原始 SVG ${page * 5 + 1}–${page * 5 + 5}`, standard: true, page, count: 5});
  result.push({kind: 'standard-detail', name: '标准 · 6x 关节细节（直接 SVG 图层）', standard: true, count: 1});
  return result;
}

function article(id, heading) {
  const node = element('article');
  node.dataset.caseId = id;
  node.append(element('div', 'case-head', heading));
  return node;
}

function appendPair(container, id, heading, left, right) {
  const item = article(id, heading);
  const pair = element('div', 'pair-stages');
  pair.append(left, right);
  item.append(pair);
  container.append(item);
}

function panelCount(group) {
  return group.kind === 'standard-detail' ? 3 : group.cases?.length ?? group.count;
}

function focusedPanels(items) {
  return currentFocus === null ? items : [items[currentFocus]];
}

function drawGroup(group, pending) {
  const grid = element('section', group.kind === 'standard-detail' ? 'detail-grid' : 'pairs');
  if (!group.standard) {
    for (const entry of focusedPanels(group.cases)) {
      const baseline = data.model.nativeBaseline(data.catalog, entry.selection, entry.context);
      const left = entry.kind === 'all-ai'
        ? stageFigure('标准比例立绘 JPG', [], pending, {reference: data.character.reference})
        : stageFigure(`N${entry.context + 1} · 原生 100`, data.model.visualLayers(data.catalog, baseline, data.character), pending);
      const right = stageFigure(`${data.character.name} · ${entry.kind === 'all-ai' ? '全套 AI' : 'AI 混搭'}`, data.model.visualLayers(data.catalog, entry.selection, data.character), pending);
      const contextLabel = entry.kind === 'all-ai' ? '标准立绘姿态 / 全套 AI' : `上下文 N${entry.context + 1}`;
      appendPair(grid, entry.id, `${entry.id} · ${contextLabel}`, left, right);
    }
  } else if (group.kind === 'standard-single' || group.kind === 'standard-detail') {
    const detail = group.kind === 'standard-detail';
    const strip = detail && currentFocus !== null;
    const stripY = strip ? currentFocus * 452 : null;
    const stripLabel = strip ? `${['上', '中', '下'][currentFocus]}横带 ${currentFocus + 1}/3 · 原6x y=[${stripY},${stripY + 452}) · 840×452，未缩放` : '';
    const id = detail ? strip ? `standard--detail-6x--strip-${currentFocus}` : 'standard--detail-6x' : 'standard--mannequin';
    const item = article(id, strip ? stripLabel : detail ? '标准完整素体 · 840 × 1356 / 6x' : '标准完整素体 · 280 × 452 / 2x');
    if (strip) item.dataset.parentCaseId = 'standard--detail-6x';
    item.append(stageFigure(strip ? `同版标准SVG完整画层840×1356 · ${stripLabel}` : '同版标准身体 + 脸 + 五官 + 裸掌', standardLayers(), pending, {scale: detail ? 6 : 2, stripY}));
    grid.append(item);
  } else if (group.kind === 'standard-native') {
    for (const context of focusedPanels([0, 1, 2, 3, 4])) appendPair(grid, `standard--native-n${context + 1}`, `标准素体 / 原生 N${context + 1}`, stageFigure(`N${context + 1} · 原生素体 100`, nativeBodyLayers(context), pending), stageFigure(`${data.character.name} · 标准素体`, standardLayers(), pending));
  } else if (group.kind === 'standard-reference') {
    appendPair(grid, 'standard--reference', '标准立绘 JPG / 同版裸标准素体', stageFigure('标准比例立绘 JPG', [], pending, {reference: data.character.reference}), stageFigure(`${data.character.name} · 标准素体`, standardLayers(), pending));
  } else if (group.kind === 'standard-swf') {
    for (const reference of focusedPanels(data.study.references.slice(group.page * 5, group.page * 5 + 5))) {
      const src = data.studyBase + reference.svg;
      appendPair(grid, 'standard--source-' + reference.id, `${reference.id} · ${reference.coverage || '原始首帧'}`, stageFigure(`${reference.id} · 原始 SVG 100`, [{key: reference.id, src, ai: false}], pending), stageFigure(`${data.character.name} · 标准素体`, standardLayers(), pending));
    }
  }
  sheet.append(grid);
}

function fail(error, token = renderGeneration) {
  if (token !== renderGeneration) return;
  const message = error instanceof Error ? error.message : String(error);
  fatal.hidden = false;
  fatal.textContent = message;
  status.dataset.state = 'error';
  status.textContent = groups.length ? `第 ${currentGroup + 1}/${groups.length} · 图层载入失败` : '冻结输入校验失败';
  sheet.dataset.state = 'error';
  sheet.setAttribute('aria-busy', 'false');
  previous.disabled = true;
  next.disabled = true;
}

async function showGroup(index) {
  check(Number.isSafeInteger(index) && index >= 0 && index < groups.length, 'group 超出本页组数');
  const token = ++renderGeneration;
  currentGroup = index;
  const group = groups[index];
  check(currentFocus === null || currentFocus < panelCount(group), `focus 超出当前组范围（0–${panelCount(group) - 1}）`);
  const caseCount = currentFocus === null ? group.cases?.length ?? group.count : 1;
  const part = currentFocus === null ? '' : ` · ${group.kind === 'standard-detail' ? '横带' : '面板'} ${currentFocus + 1}/${panelCount(group)}`;
  previous.disabled = true;
  next.disabled = true;
  fatal.hidden = true;
  fatal.textContent = '';
  status.dataset.state = 'loading';
  status.textContent = `第 ${index + 1}/${groups.length} · ${caseCount} 个案例${part} · 图层载入中`;
  sheet.replaceChildren();
  Object.assign(sheet.dataset, {state: 'loading', kind: group.kind, groupIndex: String(index), caseCount: String(caseCount), character: data.character.id, round: String(data.session.round), inputHash: data.character.inputHash});
  if (currentFocus === null) { delete sheet.dataset.focus; delete sheet.dataset.part; }
  else Object.assign(sheet.dataset, {focus: String(currentFocus), part: `${currentFocus + 1}/${panelCount(group)}`});
  delete sheet.dataset.decodedImages;
  sheet.setAttribute('aria-busy', 'true');
  const url = new URL(location.href);
  url.searchParams.set('group', String(index));
  if (currentFocus === null) url.searchParams.delete('focus');
  else url.searchParams.set('focus', String(currentFocus));
  history.replaceState({group: index}, '', url);
  const header = element('header', 'sheet-head');
  header.append(element('h2', '', `${data.character.name} · R${data.session.round} · 第 ${index + 1}/${groups.length} 组 · ${group.name}`));
  header.append(element('p', '', currentFocus === null ? `input ${data.character.inputHash} · seed ${data.session.seed} · NATIVE 100 · 未评分` : `NATIVE 100 · 未评分${part} · focus=${currentFocus}`));
  sheet.append(header);
  const pending = [];
  try {
    drawGroup(group, pending);
    await Promise.all(pending);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (token !== renderGeneration) return;
    sheet.dataset.state = 'ready';
    sheet.dataset.decodedImages = String(pending.length);
    sheet.setAttribute('aria-busy', 'false');
    status.dataset.state = 'ready';
    status.textContent = `第 ${index + 1}/${groups.length} · ${caseCount} 个案例${part} · 图层已载入`;
    previous.disabled = index === 0;
    next.disabled = index === groups.length - 1;
  } catch (error) { fail(error, token); }
}

async function initialize() {
  const query = new URLSearchParams(location.search);
  const round = integerParameter(query.get('round'), 'round', 1);
  const characterId = query.get('character');
  check(CHARACTERS.has(characterId), 'character 必须是七位角色 ID 之一');
  const group = integerParameter(query.get('group') ?? '0', 'group', 0);
  currentFocus = query.has('focus') ? integerParameter(query.get('focus'), 'focus', 0) : null;
  document.body.classList.toggle('focus-mode', currentFocus !== null);
  const roundBase = `/review-rounds/round-${round}`;
  const sessionURL = sameOriginURL(roundBase + '/session.json', roundBase + '/');
  const archivedSessionURL = sameOriginURL(`/LLM-show-fashion/results/archived/rounds/sessions/round-${round}.json`, '/LLM-show-fashion/results/archived/rounds/sessions/');
  const [sessionBytes, archivedSessionBytes] = await Promise.all([readResource(sessionURL), readResource(archivedSessionURL)]);
  const sessionHash = await digest(sessionBytes);
  check(sessionHash === await digest(archivedSessionBytes), '冻结 session 与归档 session 的 SHA 不一致');
  const session = readJSON(sessionBytes, 'session');
  check(session.round === round && session.protocol === 'fashion-react-mix-98-90-v2', '冻结轮次或协议不一致');
  check(session.catalogUrl === roundBase + '/catalog.json' && session.modelUrl === roundBase + '/review-model.mjs', '冻结目录或模型未绑定到该轮');
  check(HASH.test(session.catalogSnapshotHash || '') && HASH.test(session.renderModelHash || ''), '冻结输入缺少 SHA');
  const [catalogBytes, modelBytes] = await Promise.all([readResource(sameOriginURL(session.catalogUrl, roundBase + '/')), readResource(sameOriginURL(session.modelUrl, roundBase + '/'))]);
  check(await digest(catalogBytes) === session.catalogSnapshotHash, '冻结 catalog SHA 不匹配');
  check(await digest(modelBytes) === session.renderModelHash, '冻结 review-model SHA 不匹配');
  const catalog = readJSON(catalogBytes, 'catalog');
  check(catalog.nativeHash === session.nativeHash && catalog.snapshot?.round === round && catalog.nativeBaselineScore === 100, '目录原生输入、快照轮次或100校准不一致');
  const modelObjectURL = URL.createObjectURL(new Blob([modelBytes], {type: 'text/javascript'}));
  let model;
  try { model = await import(/* @vite-ignore */ modelObjectURL); }
  finally { URL.revokeObjectURL(modelObjectURL); }
  for (const name of ['makeCases', 'nativeSelection', 'nativeBaseline', 'visualLayers', 'standardMannequinLayers']) check(typeof model[name] === 'function', `冻结模型缺少 ${name}`);
  const character = catalog.characters.find(item => item.id === characterId);
  check(character?.ready === true && HASH.test(character.inputHash || ''), '该轮角色没有可审校的冻结输入');
  catalog.reviewSession = session;
  const studyBase = `/LLM-show-fashion/results/archived/rounds/${characterId}/round-${round}/standard-study/`;
  const studyBytes = await readResource(sameOriginURL(studyBase + 'study.json', studyBase));
  const study = readJSON(studyBytes, 'standard study');
  check(study.character === characterId && study.round === round && study.inputHash === character.inputHash && study.nativeHash === session.nativeHash && study.renderModelHash === session.renderModelHash && study.seed === session.seed, '标准素体 study 与本轮冻结输入不一致');
  check(study.files?.length === 7 && study.references?.length === 20, '标准审校必须保留7视图和20原SVG');
  data = {session, sessionHash, catalog, character, model, study, studyBase, assetBase: roundBase + '/assets/', assetHashes: new Map()};
  for (const slot of catalog.slots) for (const native of slot.native) {
    registerHash(data.assetHashes, native.src, native.svgSha256);
    for (const part of native.physicalParts || []) registerHash(data.assetHashes, part.src, part.svgSha256);
  }
  const bodySuffix = '/parts/body.svg';
  check(character.layers.body.endsWith(bodySuffix), '角色标准身体目录无法识别');
  const characterBase = character.layers.body.slice(0, -bodySuffix.length);
  for (const file of character.inputFiles || []) {
    check(typeof file.path === 'string' && !file.path.split('/').includes('..') && !file.path.includes('\\'), '角色输入相对路径无效');
    const src = file.path === 'reference.jpg' ? character.reference : file.path === 'reference.md' ? character.referenceNotes : characterBase + '/' + file.path;
    registerHash(data.assetHashes, src, file.sha256);
  }
  const actualStandard = model.standardMannequinLayers(character);
  check(JSON.stringify(actualStandard.map(layer => ({key: layer.key, src: layer.src}))) === JSON.stringify(study.standardLayers.map(layer => ({key: layer.key, src: layer.src}))), '标准素体图层顺序与冻结study不一致');
  for (const layer of study.standardLayers) registerHash(data.assetHashes, layer.src, layer.sha256);
  for (const reference of study.references) {
    check(/^sources\/[0-9]+-[0-9]+\.svg$/.test(reference.svg), '原SVG参照路径无效');
    const url = sameOriginURL(studyBase + reference.svg, studyBase + 'sources/');
    check(HASH.test(reference.svgSha256 || ''), '原SVG参照缺少 SHA');
    data.assetHashes.set(url, reference.svgSha256);
  }
  const cases = model.makeCases(catalog, character);
  check(cases.length === 246 && new Set(cases.map(entry => entry.id)).size === 246, '冻结模型未生成246唯一案例');
  groups = buildGroups(cases);
  check(group < groups.length, 'group 超出本页组数');
  identity.textContent = `${character.name} · R${round} · 246 混搭案例 / 50 组 · 7 标准组 + 1 组6x细节 · 原生100`;
  provenance.textContent = `input ${character.inputHash}\nseed ${session.seed}\nnative ${session.nativeHash}\nmodel ${session.renderModelHash}\nsession ${sessionHash}`;
  sheet.dataset.modelUrl = session.modelUrl;
  sheet.dataset.modelHash = session.renderModelHash;
  sheet.dataset.catalogHash = session.catalogSnapshotHash;
  sheet.dataset.sessionHash = sessionHash;
  document.title = `${character.name} · R${round} · 浏览器逐组审校`;
  await showGroup(group);
}

previous.addEventListener('click', () => { if (!previous.disabled) showGroup(currentGroup - 1).catch(fail); });
next.addEventListener('click', () => { if (!next.disabled) showGroup(currentGroup + 1).catch(fail); });
window.addEventListener('popstate', () => {
  if (!data) return;
  try {
    const query = new URLSearchParams(location.search);
    currentFocus = query.has('focus') ? integerParameter(query.get('focus'), 'focus', 0) : null;
    document.body.classList.toggle('focus-mode', currentFocus !== null);
    showGroup(integerParameter(query.get('group') ?? '0', 'group', 0)).catch(fail);
  }
  catch (error) { fail(error); }
});
initialize().catch(fail);
