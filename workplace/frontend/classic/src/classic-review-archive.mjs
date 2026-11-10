// Review-only replay of an immutable local input archive. Live wardrobe stays live.
const query=new URLSearchParams(location.search);
const requested=query.get('archive')||'';
export const reviewArchive=query.get('review')==='1'&&/^[a-f0-9]{20}$/.test(requested)?requested:null;
export const reviewArchivePrefix=reviewArchive?`/workplace/LLM-show-classic/results/archived/runtime/${reviewArchive}/public`:'';
export const reviewAssetUrl=url=>`${reviewArchivePrefix}${url}`;
export function rebaseReviewAssets(value){
  if(!reviewArchive)return value;
  if(typeof value==='string')return value.startsWith('/assets-classic/')?reviewAssetUrl(value):value;
  if(Array.isArray(value))return value.map(rebaseReviewAssets);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,rebaseReviewAssets(item)]));
  return value;
}
