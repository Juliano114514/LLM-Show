import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'tools', '.deps', 'package.json'));
const sharp = require('sharp');
const output = path.join(root, 'public', 'assets');
const sourceRoot = path.join(root, 'source-art');
const classicRoot = path.resolve(root, '..', 'qq-show-classic');
const atlasRoot = path.resolve(root, '..', 'ai-girls-atlas');
const canvas = { width: 140, height: 226 };
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const poseFamily = 'llm-standing-v1';

const slots = [
  { id: 'background', label: '场景', optional: true, z: 0 },
  { id: 'aura', label: '光环', optional: true, z: 5 },
  { id: 'back', label: '翅翼', optional: true, z: 10 },
  { id: 'hair', label: '发型', optional: false, z: 20, thumbnailCrop: { left: 27, top: 33, width: 86, height: 105 } },
  { id: 'legs', label: '鞋袜', optional: false, z: 30, thumbnailCrop: { left: 35, top: 145, width: 70, height: 76 } },
  { id: 'bottom', label: '裙装', optional: false, z: 40, thumbnailCrop: { left: 23, top: 113, width: 94, height: 64 } },
  { id: 'top', label: '上装', optional: false, z: 50, thumbnailCrop: { left: 20, top: 80, width: 100, height: 64 } },
  { id: 'face', label: '表情', optional: false, z: 60, thumbnailCrop: { left: 43, top: 43, width: 54, height: 54 } },
  { id: 'headwear', label: '头饰', optional: true, z: 90, thumbnailCrop: { left: 23, top: 22, width: 94, height: 65 } },
  { id: 'prop', label: '手持', optional: true, z: 100 },
  { id: 'effect', label: '闪光', optional: true, z: 110 },
];

const characters = [
  { id: 'gpt', name: 'GPT', title: '星语龙姬', description: '银白长发与浅紫星光，来自云端的小龙娘。', color: '#8d75ca', accent: '#eee8ff', background: '星座云台.gif', names: ['星座云台','星轨光环','月白龙翼','银月长卷发','星钻小礼鞋','银链月光裙','月白垂袖礼衣','紫晶微笑','银结龙角','星轨仪','紫晶星屑'] },
  { id: 'deepseek', name: 'DeepSeek', title: '深蓝鲸语', description: '海蓝卷发、鲸尾与白色蕾丝，想和你一起探索。', color: '#4e81c9', accent: '#e3f1ff', background: '海底世界.gif', names: ['海底世界','水波光环','深海鲸尾','深蓝渐层卷发','深蓝玛丽珍','鲸纹蕾丝裙','海盐女仆上衣','蓝瞳好奇','白蕾丝发箍','小鲸伙伴','海蓝泡泡'] },
  { id: 'claude', name: 'Claude', title: '橘光书笺', description: '橙色长发与温暖书香，把灵感写进每一天。', color: '#cc8752', accent: '#fff0df', background: '雏菊花开.gif', names: ['雏菊花开','暖阳光环','秋叶披肩','蜜橘长卷发','奶油系带靴','橘光层叠裙','奶油花边衬衣','琥珀温柔','橘花发饰','花笺魔法书','暖金落叶'] },
  { id: 'grok', name: 'Grok', title: '夜幕蔷薇', description: '金色双马尾和黑红裙摆，今晚也要闪闪发光。', color: '#8e4660', accent: '#f8e5ec', background: '万圣城堡.gif', names: ['万圣城堡','绯月光环','暗夜蝠翼','金砂双马尾','星扣哥特靴','黑红蔷薇裙','金饰哥特上衣','蓝瞳俏笑','黑蝴蝶结王冠','月夜斧杖','绯红星芒'] },
];

const cellNames = ['assembled', 'hair-back', 'hair-front', 'face', 'top', 'bottom', 'legs', 'headwear', 'back', 'prop', 'aura', 'effect'];
const fileUrl = (characterId, filename) => `/assets/${characterId}/${filename}.png`;
const exists = async filename => fs.access(filename).then(() => true, () => false);
const json = async filename => JSON.parse(await fs.readFile(filename, 'utf8'));
const freshCanvas = () => sharp({ create: { ...canvas, channels: 4, background: transparent } });
const sha256 = async filename => crypto.createHash('sha256').update(await fs.readFile(filename)).digest('hex');

async function alphaBounds(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 12) {
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  }
  return right < left ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function alignedCell(buffer, adjustment = {}) {
  // The full cell is the default alignment contract. Bbox-based placement is only
  // applied when an explicit, visually reviewed calibration is supplied.
  if (adjustment.targetBBox) {
    const bbox = adjustment.sourceBBox || await alphaBounds(buffer);
    if (!bbox) throw new Error('Cannot place a fully transparent source cell');
    const target = adjustment.targetBBox;
    const resized = await sharp(buffer).extract(bbox).resize(target.width, target.height, {
      fit: adjustment.preserveAspect ? 'contain' : 'fill',
      background: transparent,
      kernel: 'lanczos3',
    }).png().toBuffer();
    return freshCanvas().composite([{ input: resized, left: target.left, top: target.top }]).png().toBuffer();
  }
  if (adjustment.sourceBBox) buffer = await sharp(buffer).extract(adjustment.sourceBBox).png().toBuffer();
  const resized = await sharp(buffer).resize(canvas.width, canvas.height, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
  if (!adjustment.dx && !adjustment.dy) return resized;
  const dx = adjustment.dx || 0, dy = adjustment.dy || 0;
  const clipped = await sharp(resized).extract({ left: Math.max(0, -dx), top: Math.max(0, -dy), width: canvas.width - Math.abs(dx), height: canvas.height - Math.abs(dy) }).png().toBuffer();
  return freshCanvas().composite([{ input: clipped, left: Math.max(0, dx), top: Math.max(0, dy) }]).png().toBuffer();
}

async function prepareBackground(character) {
  const source = path.join(classicRoot, 'backgrounds', character.background);
  const metadata = await sharp(source, { animated: false, page: 0, pages: 1 }).metadata();
  if (metadata.width !== canvas.width || (metadata.pageHeight || metadata.height) !== canvas.height) {
    throw new Error(`Unexpected classic background dimensions: ${character.background}`);
  }
  await sharp(source, { animated: false, page: 0, pages: 1 }).ensureAlpha().png().toFile(path.join(output, character.id, 'background.png'));
  return { characterId: character.id, source: `qq-show-classic/backgrounds/${character.background}`, sourceSha256: await sha256(source), format: metadata.format, sourceFrames: metadata.pages || 1, exportedFrame: 0, output: fileUrl(character.id, 'background'), animation: 'static-first-frame' };
}

async function prepareCharacter(character, calibration) {
  const filename = path.join(sourceRoot, `${character.id}-sheet.png`);
  if (!(await exists(filename))) return { characterId: character.id, status: 'source-pending' };
  const metadata = await sharp(filename).metadata();
  if (!metadata.hasAlpha) throw new Error(`${character.id}: generated sheet lacks an alpha channel`);
  const characterCalibration = calibration[character.id] || {};
  let sourceInput = filename;
  if (characterCalibration._alphaRange) {
    const { low, high } = characterCalibration._alphaRange;
    const { data, info } = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let index = 3; index < data.length; index += 4) data[index] = Math.round(Math.max(0, Math.min(1, (data[index] - low) / (high - low))) * 255);
    sourceInput = await sharp(data, { raw: info }).png().toBuffer();
    await fs.writeFile(path.join(sourceRoot, `${character.id}-sheet-alpha-cleaned.png`), sourceInput);
  }
  const sourceCells = path.join(sourceRoot, 'cells', character.id);
  await fs.mkdir(sourceCells, { recursive: true });
  const report = { characterId: character.id, status: 'prepared', source: `source-art/${character.id}-sheet.png`, sourceSha256: await sha256(filename), sourceSize: [metadata.width, metadata.height], alphaProcessing: characterCalibration._alphaRange || null, layers: [] };
  for (let index = 0; index < cellNames.length; index++) {
    const name = cellNames[index], column = index % 4, row = Math.floor(index / 4);
    const left = Math.round(column * metadata.width / 4), top = Math.round(row * metadata.height / 3);
    const region = characterCalibration[name]?.region || { left, top, width: Math.round((column + 1) * metadata.width / 4) - left, height: Math.round((row + 1) * metadata.height / 3) - top };
    const rawCell = await sharp(sourceInput).extract(region).ensureAlpha().png().toBuffer();
    await fs.writeFile(path.join(sourceCells, `${name}.png`), rawCell);
    const buffer = await alignedCell(rawCell, characterCalibration[name]);
    const bounds = await alphaBounds(buffer);
    if (!bounds) throw new Error(`${character.id}/${name}: empty layer; inspect generated sheet`);
    await fs.writeFile(path.join(output, character.id, `${name}.png`), buffer);
    report.layers.push({ name, sourceRegion: region, bounds, calibration: characterCalibration[name] || null });
  }
  await freshCanvas().composite([
    { input: path.join(output, character.id, 'hair-back.png') },
    { input: path.join(output, character.id, 'hair-front.png') },
  ]).png().toFile(path.join(output, character.id, 'hair.png'));
  const layerOrder = ['aura', 'back', 'hair-back', 'legs', 'bottom', 'top', 'face', 'hair-front', 'headwear', 'prop', 'effect'];
  const composite = await freshCanvas().composite(layerOrder.map(name => ({ input: path.join(output, character.id, `${name}.png`) }))).png().toBuffer();
  await fs.writeFile(path.join(output, character.id, 'preview.png'), composite);
  await sharp(composite).extract({ left: 26, top: 27, width: 88, height: 88 }).resize(264, 264, { kernel: 'nearest' }).png().toFile(path.join(output, character.id, 'portrait.png'));
  await sharp(composite).resize(420, 678, { kernel: 'nearest' }).png().toFile(path.join(root, 'previews', `${character.id}-transparent-3x.png`));
  const scene = await sharp(path.join(output, character.id, 'background.png')).composite([{ input: composite }]).png().toBuffer();
  await sharp(scene).resize(420, 678, { kernel: 'nearest' }).png().toFile(path.join(root, 'previews', `${character.id}-scene-3x.png`));
  for (const [theme, background] of [['light', '#f3f0fa'], ['dark', '#242333']]) {
    const flattened = await sharp({ create: { ...canvas, channels: 4, background } }).composite([{ input: composite }]).png().toBuffer();
    await sharp(flattened).resize(280, 452, { kernel: 'nearest' }).png().toFile(path.join(root, 'previews', `${character.id}-${theme}-2x.png`));
  }
  return report;
}

function labelSvg(text, width, color = '#393052') {
  const escaped = text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]));
  return Buffer.from(`<svg width="${width}" height="36" xmlns="http://www.w3.org/2000/svg"><text x="${width / 2}" y="24" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="${text.length > 24 ? 12 : 16}" font-weight="600" fill="${color}">${escaped}</text></svg>`);
}

async function board(filename, entries, { columns = 4, tileWidth = 280, tileHeight = 452, background = '#f4f0fa', labelColor = '#393052' } = {}) {
  const margin = 20, gap = 16, header = 38;
  const width = margin * 2 + columns * tileWidth + (columns - 1) * gap;
  const rows = Math.ceil(entries.length / columns);
  const height = margin * 2 + rows * (tileHeight + header) + (rows - 1) * gap;
  const layers = [];
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index], column = index % columns, row = Math.floor(index / columns);
    const left = margin + column * (tileWidth + gap), top = margin + row * (tileHeight + header + gap);
    layers.push({ input: labelSvg(entry.label, tileWidth, labelColor), left, top });
    const input = await sharp(entry.input).resize(tileWidth, tileHeight, { kernel: 'nearest', fit: 'fill' }).png().toBuffer();
    layers.push({ input, left, top: top + header });
  }
  await sharp({ create: { width, height, channels: 4, background } }).composite(layers).png().toFile(path.join(root, 'previews', filename));
}

async function composeParts(selection, includeBackground = false) {
  const order = [['aura', 'aura'], ['back', 'back'], ['hair', 'hair-back'], ['legs', 'legs'], ['bottom', 'bottom'], ['top', 'top'], ['face', 'face'], ['hair', 'hair-front'], ['headwear', 'headwear'], ['prop', 'prop'], ['effect', 'effect']];
  const layers = [];
  if (includeBackground && selection.background) layers.push({ input: path.join(output, selection.background, 'background.png') });
  for (const [slot, file] of order) if (selection[slot]) layers.push({ input: path.join(output, selection[slot], `${file}.png`) });
  return freshCanvas().composite(layers).png().toBuffer();
}

async function prepareBoards() {
  const prepared = await Promise.all(characters.map(character => exists(path.join(output, character.id, 'preview.png'))));
  if (!prepared.every(Boolean)) return;
  await board('four-characters-scenes.png', characters.map(character => ({ label: character.name, input: path.join(root, 'previews', `${character.id}-scene-3x.png`) })));
  await board('four-characters-light.png', characters.map(character => ({ label: character.name, input: path.join(output, character.id, 'preview.png') })));
  await board('four-characters-dark.png', characters.map(character => ({ label: character.name, input: path.join(output, character.id, 'preview.png') })), { background: '#252331', labelColor: '#f3eafa' });
  const heads = [];
  for (const face of characters) for (const hair of characters) {
    const composite = await composeParts({ face: face.id, hair: hair.id });
    const crop = await sharp(composite).extract({ left: 20, top: 10, width: 100, height: 145 }).png().toBuffer();
    heads.push({ label: `${face.name} face / ${hair.name} hair`, input: crop });
  }
  await board('face-hair-cross-4x4.png', heads, { tileWidth: 200, tileHeight: 290 });
  const mixes = [];
  for (let index = 0; index < characters.length; index++) {
    const id = offset => characters[(index + offset) % characters.length].id;
    const selection = { background: id(0), face: id(0), hair: id(1), top: id(2), bottom: id(3), legs: id(0), back: id(1), headwear: id(1), prop: id(3), aura: id(0), effect: id(2) };
    const input = await composeParts(selection);
    await fs.writeFile(path.join(root, 'previews', `mixed-${index + 1}.png`), input);
    mixes.push({ label: `MIX ${index + 1} / ${characters[index].name}`, input });
  }
  await board('four-mixed-outfits.png', mixes);
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  await fs.mkdir(path.join(root, 'previews'), { recursive: true });
  const calibrationFile = path.join(root, 'tools', 'asset-calibration.json');
  const calibration = await exists(calibrationFile) ? await json(calibrationFile) : {};
  const sourceCatalog = await json(path.join(atlasRoot, 'data', 'assets.json'));
  const references = sourceCatalog.assets.filter(asset => asset.collection === 'apprentice' && characters.some(character => character.id === asset.character_id) && asset.kind === 'chibi-derivative');
  const backgrounds = [], reports = [], items = [];
  for (const character of characters) {
    await fs.mkdir(path.join(output, character.id), { recursive: true });
    backgrounds.push(await prepareBackground(character));
    if (!process.argv.includes('--backgrounds-only')) reports.push(await prepareCharacter(character, calibration));
    character.portrait = fileUrl(character.id, 'portrait');
    character.preview = fileUrl(character.id, 'preview');
    character.preset = Object.fromEntries(slots.map(slot => [slot.id, `${character.id}-${slot.id}`]));
    slots.forEach((slot, index) => {
      const item = { id: `${character.id}-${slot.id}`, name: character.names[index], slot: slot.id, characterId: character.id, src: fileUrl(character.id, slot.id), poseFamily, animation: { kind: 'static' }, description: `${character.name}「${character.names[index]}」；统一 ${canvas.width}×${canvas.height} 画布。` };
      if (slot.id === 'hair') item.layers = [{ src: fileUrl(character.id, 'hair-back'), z: 20 }, { src: fileUrl(character.id, 'hair-front'), z: 80 }];
      items.push(item);
    });
  }
  const publicCharacters = characters.map(({ background, names, ...character }) => character);
  const manifest = { version: 1, canvas, poseFamily, slots, characters: publicCharacters, items, credits: { title: 'AI 娘 QQ 秀 · 非官方同人重制', characterDesign: 'ZipZipPipe；DeepSeek 原始鲸鱼娘：上善无形', referenceArt: 'ApprenTice（AI 辅助派生图）', license: 'CC BY-NC-SA 4.0（角色重制资产）；经典 QQ 秀背景沿用原素材范围', notice: '/assets/source-references.json', artStatus: 'static-layered-remake' } };
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await fs.writeFile(path.join(output, 'source-references.json'), JSON.stringify({ generatedOn: '2026-11-09', generatedArt: { tool: 'OpenAI built-in image_gen', processing: 'Node.js sharp；透明分件提取、显式锚点校准与静态合成', poseFamily, canvas, license: 'CC-BY-NC-SA-4.0', unofficial: true, alphaAdjustments: Object.fromEntries(Object.entries(calibration).filter(([, value]) => value._alphaRange).map(([id, value]) => [id, value._alphaRange])) }, references, classicBackgrounds: backgrounds, notes: ['参考图片与角色权利归原作者；本重制不改变原有署名与许可范围。', '经典 QQ 秀背景仅导出首帧，未承诺动画。', '分件采用新姿态族，不承诺与所有历史 QQ 秀部件兼容。'] }, null, 2) + '\n');
  if (reports.length) await fs.writeFile(path.join(root, 'previews', 'asset-report.json'), JSON.stringify(reports, null, 2) + '\n');
  if (!process.argv.includes('--backgrounds-only')) await prepareBoards();
  console.log(JSON.stringify({ canvas, items: items.length, backgrounds: backgrounds.length, characters: reports.map(({ characterId, status }) => ({ characterId, status })) }, null, 2));
}

await main();
