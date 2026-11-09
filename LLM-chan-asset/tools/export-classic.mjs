import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { sharp } from './pixel-svg.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'deliverables/classic-final');
const previewRoot = path.join(root, 'previews/classic');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/assets-classic/manifest.json'), 'utf8'));
const { width, height } = manifest.canvas;
const delay = Array(8).fill(240);
const phases = [.35, .65, 1, .65, .35, .5, .8, .5];
const items = new Map(manifest.items.map(item => [item.id, item]));
const blank = () => sharp({ create: { width, height, channels: 4, background: '#00000000' } });
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const report = {
  canvas: { width, height },
  poseFamily: manifest.poseFamily,
  animation: { frames: phases.length, delay, durationMs: delay.reduce((a, b) => a + b), loop: 0, motion: 'Only the existing effect layer changes opacity; character, face and background remain static.' },
  characters: [],
};
await fs.mkdir(destination, { recursive: true });
await fs.mkdir(previewRoot, { recursive: true });

function layersFor(character, exclude = []) {
  return manifest.slots.flatMap(slot => {
    if (exclude.includes(slot.id)) return [];
    const item = items.get(character.preset[slot.id]);
    if (!item || item.slot !== slot.id) return [];
    return (item.layers?.length ? item.layers : [{ src: item.src, z: slot.z }])
      .map(layer => ({ ...layer, z: layer.z ?? slot.z, slot: slot.id }));
  }).sort((a, b) => a.z - b.z);
}

async function composite(layers) {
  return blank().composite(layers.map(layer => {
    if (!layer.src.startsWith('/assets-classic/')) throw new Error(`Unexpected local asset: ${layer.src}`);
    return { input: path.join(root, 'public', layer.src) };
  })).png().toBuffer();
}

const proof = [];
const overview = [], labels = [];
const gridWidth = 1200, gridHeight = Math.ceil(manifest.characters.length / 4) * 540;
const xmlText = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const [index, character] of manifest.characters.entries()) {
  if (!/^[a-z0-9-]+$/.test(character.id)) throw new Error('Invalid character export identifier');
  const folder = path.join(destination, character.id);
  await fs.mkdir(folder, { recursive: true });
  const allLayers = layersFor(character);
  const effectLayers = allLayers.filter(layer => layer.slot === 'effect');
  if (!effectLayers.length || allLayers.at(-1).slot !== 'effect') throw new Error('Animation expects an effect above the character');
  const scene = await composite(allLayers);
  const transparent = await composite(layersFor(character, ['background']));
  const still = await composite(layersFor(character, ['effect']));
  const effect = await sharp(await composite(effectLayers)).ensureAlpha().raw().toBuffer();
  const frames = [];
  for (const phase of phases) {
    const pixels = Buffer.from(effect);
    for (let n = 3; n < pixels.length; n += 4) pixels[n] = Math.round(pixels[n] * phase);
    frames.push(await sharp(still).composite([{ input: pixels, raw: { width, height, channels: 4 } }]).ensureAlpha().raw().toBuffer());
  }
  const gif = await sharp(Buffer.concat(frames), {
    raw: { width, height: height * frames.length, channels: 4, pageHeight: height },
  }).gif({ loop: 0, delay, colours: 256, dither: .1, effort: 7, keepDuplicateFrames: true }).toBuffer();
  const gifMeta = await sharp(gif, { animated: true }).metadata();
  const decoded = await sharp(gif, { animated: true }).ensureAlpha().raw().toBuffer();
  const frameSize = width * height * 4;
  const decodedFrames = Array.from({ length: gifMeta.pages }, (_, n) => decoded.subarray(n * frameSize, (n + 1) * frameSize));
  const uniqueFrames = new Set(decodedFrames.map(sha256)).size;
  if (gifMeta.width !== width || gifMeta.pageHeight !== height || gifMeta.pages !== phases.length || gifMeta.loop !== 0 || gifMeta.delay?.length !== delay.length || gifMeta.delay.some((ms, n) => ms !== delay[n]) || decoded.length !== frameSize * phases.length || uniqueFrames < 2) throw new Error(`Invalid GIF export: ${character.id}`);
  let changedPixelsOutsideEffect = 0;
  for (let p = 0; p < frameSize; p += 4) {
    if (effect[p + 3]) continue;
    if (decodedFrames.some(frame => !frame.subarray(p, p + 4).equals(decodedFrames[0].subarray(p, p + 4)))) changedPixelsOutsideEffect++;
  }
  if (changedPixelsOutsideEffect) throw new Error(`GIF changed static pixels: ${character.id}`);
  const outputs = {
    [`${character.id}.png`]: scene,
    [`${character.id}-transparent.png`]: transparent,
    [`${character.id}-3x.png`]: await sharp(scene).resize(width * 3, height * 3, { kernel: 'nearest' }).png().toBuffer(),
    [`${character.id}.gif`]: gif,
  };
  const files = [];
  for (const [name, data] of Object.entries(outputs)) {
    await fs.writeFile(path.join(folder, name), data);
    files.push({ file: `${character.id}/${name}`, bytes: data.length, sha256: sha256(data) });
  }
  report.characters.push({ id: character.id, name: character.name, files, gif: { width, height, frames: gifMeta.pages, delay: gifMeta.delay, loop: gifMeta.loop, uniqueDecodedFrames: uniqueFrames, changedPixelsOutsideEffect } });
  const row = Math.floor(index / 4), rowCount = Math.min(4, manifest.characters.length - row * 4);
  const left = (gridWidth - rowCount * 300) / 2 + (index % 4) * 300, top = row * 540;
  overview.push({ input: await sharp(scene).resize(280, 452, { kernel: 'nearest' }).png().toBuffer(), left: left + 10, top: top + 62 });
  labels.push(`<text x="${left + 150}" y="${top + 25}" font-size="18">${xmlText(character.name)}</text><text x="${left + 150}" y="${top + 49}" font-size="13">${xmlText(items.get(character.preset.background)?.name ?? '')}</text>`);
  for (const [column, frame] of [0, 2, 4, 6].entries()) {
    proof.push({ input: await sharp(decodedFrames[frame], { raw: { width, height, channels: 4 } }).png().toBuffer(), left: column * width, top: (report.characters.length - 1) * height });
  }
}
await sharp({ create: { width: width * 4, height: height * manifest.characters.length, channels: 4, background: '#eeeaf2' } }).composite(proof).png().toFile(path.join(previewRoot, 'final-gif-decoded-frames.png'));
const titles = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${gridWidth}" height="${gridHeight}"><g fill="#50475f" text-anchor="middle" font-family="Microsoft YaHei, sans-serif">${labels.join('')}</g></svg>`);
await sharp({ create: { width: gridWidth, height: gridHeight, channels: 4, background: '#eeeaf2' } }).composite([...overview, { input: titles }]).png().toFile(path.join(destination, 'all-seven-preview.png'));
await fs.writeFile(path.join(destination, 'export-report.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(destination, 'README.txt'), `经典 QQ 秀 · 七家 AI 同人定稿\n\n每个角色目录：\n{id}.png：140×226，含场景的静态图。\n{id}-transparent.png：140×226，透明背景人物及配饰。\n{id}-3x.png：420×678，最近邻放大预览。\n{id}.gif：140×226，8 帧、每帧 240ms、1.92 秒无限循环。只让原有特效轻闪，人物和表情不动。\n\nall-seven-preview.png 为七家总览；export-report.json 记录文件哈希与解码检查。\n本地同人产物，具体来源与权利边界沿用项目 ATTRIBUTION.md、LICENSE 和 COMPLIANCE.md；此导出不新增再分发授权。\n`);
console.log(JSON.stringify({ output: destination, characters: report.characters.length, filesPerCharacter: 4, animation: report.animation }));
