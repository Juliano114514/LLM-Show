// Pure shared contracts. No artwork is created here and no score is inferred.
export const NATIVE_PROP_TOP_POLICY='native-prop-top-v1';
export const NATIVE_CONTACT_POLICY='ai-native-leg-contact-v1';
export const CONTACT_ALGORITHM_VERSION='authored-contact-clusters-v1';
export const NATIVE_BOTTOM_TOP_POLICY='ai-top-native-bottom-contact-v1';
export const UPPER_CONTACT_ALGORITHM_VERSION='authored-top-hem-clusters-v1';

export function upperContactInputs(topBodyArtworkHash,native){
  return {topBodyArtworkHash,nativeSourceKey:native.sourceKey,nativeSourceRawHash:native.sourceRawHash,nativeVisibleBottomHash:native.visibleBottom?.artworkHash,algorithmVersion:UPPER_CONTACT_ALGORITHM_VERSION};
}

export function contactInterfaceInputs(bottomArtworkHash,native,algorithmVersion=CONTACT_ALGORITHM_VERSION){
  return {
    bottomArtworkHash,
    nativeSourceKey:native.sourceKey,
    nativeSourceRawHash:native.sourceRawHash,
    nativeUnfilledLegsHash:native.visibleLegs?.artworkHash,
    nativePatchHash:native.hiddenPatch?.artworkHash,
    algorithmVersion,
  };
}
export const contactInputKey=inputs=>JSON.stringify(inputs);
export function nativePropTopVariant(item){
  const v=item?.defaultVariant;
  return item?.slot==='top'&&v?.variantRole==='native-display'&&v.poseFamily===item.poseFamily&&v.compatibilityPolicy===NATIVE_PROP_TOP_POLICY&&v.src&&/^[a-f0-9]{64}$/.test(v.artworkHash||'')&&(!v.layers||v.layers.length&&v.layers.every(l=>l.src&&/^[a-f0-9]{64}$/.test(l.artworkHash||'')))?v:null;
}
function authoredContactEntry(entry){
  return Boolean(entry?.enabled&&!entry.placeholder&&entry.authoringStatus==='authored-contact-candidate'&&entry.compatibilityPolicy===NATIVE_CONTACT_POLICY&&entry.algorithmVersion===CONTACT_ALGORITHM_VERSION&&entry.src&&/^[a-f0-9]{64}$/.test(entry.artworkHash||'')&&/^[a-f0-9]{64}$/.test(entry.contactTone?.artworkHash||'')&&entry.contactTone.pixels>0&&/^[a-f0-9]{64}$/.test(entry.inputDigest||'')&&entry.inputKey===contactInputKey(entry.inputs));
}
export function matchingContactInterface(item,native,bottomArtworkHash){
  const entry=item?.nativeLegInterfaces?.[native?.sourceKey];
  if(!authoredContactEntry(entry))return null;
  const expected=contactInterfaceInputs(bottomArtworkHash,native);
  // The authoring pipeline verifies SHA256(inputKey); the synchronous renderer
  // compares every source component, rather than inventing a browser hash.
  if(contactInputKey(entry.inputs)!==contactInputKey(expected)||entry.inputKey!==contactInputKey(expected))return null;
  return entry;
}
function authoredUpperContact(entry){
  return Boolean(entry?.enabled&&!entry.placeholder&&entry.authoringStatus==='authored-top-contact-candidate'&&entry.compatibilityPolicy===NATIVE_BOTTOM_TOP_POLICY&&entry.algorithmVersion===UPPER_CONTACT_ALGORITHM_VERSION&&entry.src&&/^[a-f0-9]{64}$/.test(entry.artworkHash||'')&&entry.pixels>0&&entry.z===49&&/^[a-f0-9]{64}$/.test(entry.inputDigest||'')&&entry.inputKey===contactInputKey(entry.inputs));
}
export function matchingUpperContact(item,native,topBodyArtworkHash){
  const entry=item?.nativeBottomTopContacts?.[native?.sourceKey];
  if(!authoredUpperContact(entry))return null;
  const expected=contactInputKey(upperContactInputs(topBodyArtworkHash,native));
  return entry.inputKey===expected?entry:null;
}
export function itemCompatibilityPolicies(item){
  const policies=[];
  if(nativePropTopVariant(item))policies.push(NATIVE_PROP_TOP_POLICY);
  if(Object.values(item?.nativeLegInterfaces||{}).some(authoredContactEntry))policies.push(NATIVE_CONTACT_POLICY);
  if(Object.values(item?.nativeBottomTopContacts||{}).some(authoredUpperContact))policies.push(NATIVE_BOTTOM_TOP_POLICY);
  return policies;
}
export function compatibilityFamilyPayload(own,native,interfaces,upperContacts){
  // Keep this legacy shape/key order exactly: no-flag characters retain their
  // historical family hashes even when the new renderer is available.
  const payload={own:own.artworkHash,ownLayers:own.layers?.map(({artworkHash,z})=>({artworkHash,z}))||null,native:native?.artworkHash||null};
  if(native?.compatibilityPolicy===NATIVE_PROP_TOP_POLICY){
    payload.compatibilityPolicy=NATIVE_PROP_TOP_POLICY;
    payload.nativeLayers=native.layers?.map(({artworkHash,z})=>({artworkHash,z}))||null;
  }
  const active=Object.entries(interfaces||{}).filter(([,entry])=>authoredContactEntry(entry)).sort(([a],[b])=>a.localeCompare(b));
  if(active.length)payload.nativeLegInterfaces=Object.fromEntries(active.map(([key,e])=>[key,{artworkHash:e.artworkHash,contactArtworkHash:e.contactTone?.artworkHash,inputs:e.inputs,inputKey:e.inputKey,inputDigest:e.inputDigest,compatibilityPolicy:e.compatibilityPolicy,algorithmVersion:e.algorithmVersion,z:e.z??31}]));
  const upperActive=Object.entries(upperContacts||{}).filter(([,entry])=>authoredUpperContact(entry)).sort(([a],[b])=>a.localeCompare(b));
  if(upperActive.length)payload.nativeBottomTopContacts=Object.fromEntries(upperActive.map(([key,e])=>[key,{artworkHash:e.artworkHash,inputs:e.inputs,inputKey:e.inputKey,inputDigest:e.inputDigest,compatibilityPolicy:e.compatibilityPolicy,algorithmVersion:e.algorithmVersion,z:e.z}]));
  return payload;
}
