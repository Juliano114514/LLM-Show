import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { sharp, svgDocument } from './pixel-svg.mjs';
import { celestialMotion, CELESTIAL_MOTION_NOTES } from './scene-motion-celestial.mjs';
import { dailyMotion, DAILY_MOTION_NOTES } from './scene-motion-daily.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'deliverables/classic-animated-scenes');
const preview = path.join(root, 'previews/classic');
const manifestPath = path.join(root, 'public/assets-classic/manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const W = 140, H = 226, N = 20, delay = Array(N).fill(160), frameSize = W * H * 4;
if (manifest.canvas.width !== W || manifest.canvas.height !== H) throw new Error('Scene motions require the classic 140×226 canvas');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const local = src => path.join(root, 'public', src);
const blank = () => sharp({ create: { width: W, height: H, channels: 4, background: '#00000000' } });
const notes = { ...CELESTIAL_MOTION_NOTES, ...DAILY_MOTION_NOTES };
const motion = (id, phase) => Buffer.from(svgDocument(celestialMotion(id, phase) + dailyMotion(id, phase)));
const report = { canvas: [W, H], frames: N, delay, durationMs: N * delay[0], loop: 0, sourcePolicy: 'Static PNG/SVG assets and original character layers remain unchanged.', characters: [] };
await fs.mkdir(output, { recursive: true });
await fs.mkdir(preview, { recursive: true });

function foregroundLayers(character) {
  return manifest.slots.flatMap(slot => {
    if (slot.id === 'background') return [];
    const item = manifest.items.find(item => item.id === character.preset[slot.id] && item.slot === slot.id);
    return item ? (item.layers?.length ? item.layers : [{ src: item.src, z: slot.z }]) : [];
  }).sort((a, b) => a.z - b.z).map(layer => {
    if (!layer.src.startsWith('/assets-classic/')) throw new Error('Expected local classic assets');
    return { input: local(layer.src) };
  });
}

async function encode(frames, width = W, height = H, protectedPixels) {
  const gif = await sharp(Buffer.concat(frames), { raw: { width, height: height * N, channels: 4, pageHeight: height } })
    .gif({ loop: 0, delay, colours: 256, dither: 0, interFrameMaxError: 0, interPaletteMaxError: 256, keepDuplicateFrames: true }).toBuffer();
  const metadata = await sharp(gif, { animated: true }).metadata();
  const data = await sharp(gif, { animated: true }).ensureAlpha().raw().toBuffer();
  const size = width * height * 4;
  if (metadata.width !== width || metadata.pageHeight !== height || metadata.pages !== N || metadata.loop !== 0 || metadata.delay?.length !== N || metadata.delay.some((ms, i) => ms !== delay[i]) || data.length !== size * N) throw new Error('GIF timeline or dimensions differ from the rendered scene');
  const decoded = Array.from({ length: N }, (_, i) => data.subarray(i * size, (i + 1) * size));
  const uniqueFrames = new Set(decoded.map(hash)).size;
  if (uniqueFrames < 4) throw new Error('Scene GIF has insufficient environmental motion');
  let changedProtectedPixels = 0;
  if (protectedPixels) for (let p = 0; p < size; p += 4) {
    if (protectedPixels[p + 3] !== 255) continue;
    if (decoded.some(frame => !frame.subarray(p, p + 4).equals(decoded[0].subarray(p, p + 4)))) changedProtectedPixels++;
  }
  if (changedProtectedPixels) throw new Error(`Scene animation changed ${changedProtectedPixels} opaque foreground pixels`);
  return { gif, decoded, metadata: { width, height, frames: N, delay, loop: 0, uniqueDecodedFrames: uniqueFrames, ...(protectedPixels ? { changedOpaqueForegroundPixels: changedProtectedPixels } : {}) } };
}

const proofs = [], covers = [], sceneFrames = [];
for (const [index, character] of manifest.characters.entries()) {
  if (!/^[a-z0-9-]+$/.test(character.id) || !notes[character.id]) throw new Error('Missing scene motion design');
  const folder = path.join(output, character.id);
  await fs.mkdir(folder, { recursive: true });
  const backgroundItem = manifest.items.find(item => item.id === character.preset.background && item.slot === 'background');
  if (!backgroundItem?.src.startsWith('/assets-classic/') || !backgroundItem.src.endsWith('.png')) throw new Error('Expected a local static PNG background');
  const background = await fs.readFile(local(backgroundItem.src));
  const foreground = await blank().composite(foregroundLayers(character)).png().toBuffer();
  const foregroundRaw = await sharp(foreground).ensureAlpha().raw().toBuffer();
  // Verify the continuous motion endpoint, including alpha, before GIF sampling.
  const firstOverlay = await sharp(motion(character.id, 0)).ensureAlpha().raw().toBuffer();
  const endpoint = await sharp(motion(character.id, 1)).ensureAlpha().raw().toBuffer();
  if (!firstOverlay.equals(endpoint)) throw new Error(`Non-periodic scene overlay: ${character.id}`);
  const backgroundFrames = [], fullFrames = [];
  for (let frame = 0; frame < N; frame++) {
    const overlay = await sharp(motion(character.id, frame / N)).png().toBuffer();
    backgroundFrames.push(await sharp(background).composite([{ input: overlay }]).ensureAlpha().raw().toBuffer());
    fullFrames.push(await sharp(background).composite([{ input: overlay }, { input: foreground }]).ensureAlpha().raw().toBuffer());
  }
  const animatedBackground = await encode(backgroundFrames);
  const animatedScene = await encode(fullFrames, W, H, foregroundRaw);
  const enlarged = await Promise.all(animatedScene.decoded.map(frame => sharp(frame, { raw: { width: W, height: H, channels: 4 } }).resize(W * 3, H * 3, { kernel: 'nearest' }).raw().toBuffer()));
  const largeScene = await encode(enlarged, W * 3, H * 3);
  const scenePng = await sharp(animatedScene.decoded[0], { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const files = [];
  for (const [name, bytes] of Object.entries({ [`${character.id}-scene.gif`]: animatedScene.gif, [`${character.id}-background.gif`]: animatedBackground.gif, [`${character.id}-scene-3x.gif`]: largeScene.gif, [`${character.id}-scene.png`]: scenePng })) {
    await fs.writeFile(path.join(folder, name), bytes);
    files.push({ file: `${character.id}/${name}`, bytes: bytes.length, sha256: hash(bytes) });
  }
  const animatedSrc = backgroundItem.src.replace(/\.png$/, '.gif');
  await fs.writeFile(local(animatedSrc), animatedBackground.gif);
  backgroundItem.animatedSrc = animatedSrc;
  backgroundItem.animation = { frames: N, durationMs: N * delay[0], loop: 0, note: notes[character.id] };
  let changedEnvironmentPixels = 0;
  for (let p = 0; p < frameSize; p += 4) if (animatedBackground.decoded.some(frame => !frame.subarray(p, p + 4).equals(animatedBackground.decoded[0].subarray(p, p + 4)))) changedEnvironmentPixels++;
  let visibleEnvironmentPixels = 0;
  for (let p = 0; p < frameSize; p += 4) {
    if (foregroundRaw[p + 3] === 255) continue;
    if (animatedScene.decoded.some(frame => !frame.subarray(p, p + 4).equals(animatedScene.decoded[0].subarray(p, p + 4)))) visibleEnvironmentPixels++;
  }
  if (visibleEnvironmentPixels < 10) throw new Error(`Scene motion hidden by character: ${character.id}`);
  report.characters.push({ id: character.id, name: character.name, motion: notes[character.id], backgroundSha256: hash(background), foregroundSha256: hash(foreground), periodicEndpointExact: true, changedEnvironmentPixels, visibleEnvironmentPixels, backgroundGif: animatedBackground.metadata, sceneGif: animatedScene.metadata, files });
  sceneFrames.push(animatedScene.decoded);
  covers.push({ input: await sharp(scenePng).resize(W * 2, H * 2, { kernel: 'nearest' }).png().toBuffer(), left: index * W * 2, top: 0 });
  for (const [column, frame] of [0, 5, 10, 15].entries()) proofs.push({ input: await sharp(animatedScene.decoded[frame], { raw: { width: W, height: H, channels: 4 } }).png().toBuffer(), left: column * W, top: index * H });
}
await sharp({ create: { width: W * 4, height: H * manifest.characters.length, channels: 4, background: '#eeeaf2' } }).composite(proofs).png().toFile(path.join(preview, 'animated-scenes-decoded-frames.png'));
await sharp({ create: { width: W * 2 * manifest.characters.length, height: H * 2, channels: 4, background: '#eeeaf2' } }).composite(covers).png().toFile(path.join(output, 'all-seven-covers.png'));
// A compact native-pixel overview remains a real animation, not a contact sheet.
const overviewWidth = W * 4, overviewHeight = H * 2, overviewFrames = [];
for (let frame = 0; frame < N; frame++) {
  const cells = await Promise.all(sceneFrames.map(async (frames, index) => {
    const row = Math.floor(index / 4), count = Math.min(4, sceneFrames.length - row * 4);
    return { input: await sharp(frames[frame], { raw: { width: W, height: H, channels: 4 } }).png().toBuffer(), left: (overviewWidth - count * W) / 2 + (index % 4) * W, top: row * H };
  }));
  overviewFrames.push(await sharp({ create: { width: overviewWidth, height: overviewHeight, channels: 4, background: '#eeeaf2' } }).composite(cells).raw().toBuffer());
}
await fs.writeFile(path.join(output, 'all-seven-animated.gif'), (await encode(overviewFrames, overviewWidth, overviewHeight)).gif);
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(path.join(output, 'animation-report.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.join(output, 'README.txt'), `经典 QQ 秀 · 七套场景动图\n\n每家目录：\n{id}-scene.gif：140×226，人物与动态场景合成。\n{id}-background.gif：140×226，独立背景动图。\n{id}-scene-3x.gif：420×678，最近邻放大预览。\n{id}-scene.png：静态代表帧。\n\n全部 GIF 为20帧，每帧160ms，3.2秒无限循环。人物画层及表情固定，背景的热气、云、光点和花瓣等局部运动；建筑与镜头固定。all-seven-animated.gif 为七家合成动态总览。animation-report.json 记录实际解码、首尾周期检查、可见动区与人物像素检查。\n原有静态图与上一版仅闪光 GIF 保留在 classic-final 目录。此产物沿用项目 ATTRIBUTION.md、LICENSE 与 COMPLIANCE.md 的权利边界，不新增美术再分发授权。\n`);
console.log(JSON.stringify({ output, frames: N, durationMs: N * delay[0], characters: report.characters.map(({ id, changedEnvironmentPixels, visibleEnvironmentPixels }) => ({ id, changedEnvironmentPixels, visibleEnvironmentPixels })) }));
