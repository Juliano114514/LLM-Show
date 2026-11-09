// One shared pearl/lavender/silver palette for GPT's hair, horns, wings and dress.
export const GPT_COLORS = Object.freeze({
  pearl:'#F7F4FC', shadow:'#D6CFE4', mid:'#E8E1F1', contour:'#817492',
  deep:'#625873', metal:'#B9B3CB', highlight:'#FFFDFC', gem:'#B3A0D4',
});
const rgb=hex=>[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16));
export function gptTone(level){
  const stops=[[0,GPT_COLORS.deep],[.10,GPT_COLORS.contour],[.28,GPT_COLORS.shadow],[.55,GPT_COLORS.mid],[.78,GPT_COLORS.pearl],[1,GPT_COLORS.highlight]];
  const value=Math.max(0,Math.min(1,level));
  const at=stops.findIndex(s=>s[0]>=value),upper=stops[at<0?stops.length-1:at],lower=stops[Math.max(0,at-1)];
  const t=upper[0]===lower[0]?0:(value-lower[0])/(upper[0]-lower[0]);
  const a=rgb(lower[1]),b=rgb(upper[1]);return a.map((v,i)=>Math.round(v+(b[i]-v)*t));
}
