import { createRequire } from 'node:module';
const require = createRequire(new URL('./.deps/package.json', import.meta.url));
export const sharp = require('sharp');
export const W = 140, H = 226;
export function svgDocument(content, title = 'QQ Show default-standing-v1') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="226" viewBox="0 0 140 226" shape-rendering="crispEdges"><title>${title}</title>${content}</svg>`;
}
// Exact raster-to-vector tracing: each path is a set of integer-coordinate
// horizontal pixel runs of a single RGBA value. There are no embedded bitmaps.
export async function toPixelSvg(input, options = {}) {
  const { data, info } = await sharp(input, { animated: false, page: 0, pages: 1 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const palette = new Map();
  for (let y = 0; y < info.height; y++) {
    let x = 0;
    while (x < info.width) {
      const rgbaAt = px => {
        const n = (y * info.width + px) * 4;
        const c = [...data.subarray(n, n + 4)];
        return options.mapColor ? options.mapColor(c, px, y) : c;
      };
      const c = rgbaAt(x), start = x++;
      while (x < info.width && rgbaAt(x).every((v, i) => v === c[i])) x++;
      if (!c[3]) continue;
      const key = c.join(',');
      if (!palette.has(key)) palette.set(key, { color: c, paths: [] });
      palette.get(key).paths.push(`M${start} ${y}h${x - start}v1h-${x - start}Z`);
    }
  }
  const paths = [...palette.values()].map(({ color: [r,g,b,a], paths }) => `<path fill="#${[r,g,b].map(c => Math.round(c).toString(16).padStart(2,'0')).join('')}"${a < 255 ? ` fill-opacity="${(a / 255).toFixed(4)}"` : ''} d="${paths.join('')}"/>`).join('');
  return svgDocument(paths, options.title);
}
export async function alphaBox(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let l = info.width, t = info.height, r = -1, b = -1;
  for (let y=0; y<info.height; y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>16){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  return r < 0 ? null : [l,t,r+1,b+1];
}
