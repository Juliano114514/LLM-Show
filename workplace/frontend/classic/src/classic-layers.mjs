// The selected upper garment controls the shared pose of compatible body parts.
// Keep this resolver shared by the wardrobe, static exports and scene exports.
import {NATIVE_PROP_TOP_POLICY,nativePropTopVariant,matchingContactInterface,matchingUpperContact} from './classic-compatibility.mjs';
export const NATIVE_LOWER_POLICY = 'native-lower-provenance-v1';
export function resolveClassicLayers(manifest, selection, { excludeSlots = [] } = {}) {
  const itemsById = new Map(manifest.items.map(item => [item.id, item]));
  const top = itemsById.get(selection.top);
  const poseId = top?.slot === 'top' ? top.poseId || 'default' : 'default';
  // Visibility controls do not change the selected prop's identity or pose.
  const selectedProp=itemsById.get(selection.prop);
  const selectedNativeProp=selectedProp?.slot==='prop'&&selectedProp.characterId==='native';
  function variantFor(item){
    const own=item.poseFamily==='classic-body-first-remake-v1'?item.poseVariants?.[item.characterId]:null;
    const native=item.defaultVariant?.poseFamily===item.poseFamily&&item.defaultVariant?.variantRole==='native-display'?item.defaultVariant:null;
    if(own&&item.slot==='top'&&native?.compatibilityPolicy===NATIVE_PROP_TOP_POLICY)return selectedNativeProp&&nativePropTopVariant(item)?native:own;
    return own?(poseId==='default'&&native?native:own):poseId==='default'?item.defaultVariant||item:item.poseVariants?.[poseId]||item;
  }
  const lower = Object.fromEntries(['bottom','legs'].map(slot=>[slot,excludeSlots.includes(slot)?null:itemsById.get(selection[slot])]));
  const native = item=>item?.characterId==='native'&&item.nativePartition?.policy===NATIVE_LOWER_POLICY?item.nativePartition:null;
  const nativeBottom=native(lower.bottom), nativeLegs=native(lower.legs);
  const wholeLower=nativeBottom&&nativeLegs&&nativeBottom.sourceKey===nativeLegs.sourceKey&&nativeBottom.originalFull?.src;
  const currentAi=item=>item?.poseFamily==='classic-body-first-remake-v1'&&manifest.characters?.some(character=>character.id===item.characterId);
  const assetLayer=(asset,item,role,extra={})=>({src:asset.src,svg:asset.svg,artworkHash:asset.artworkHash,z:40,key:`${item.id}-${role}`,itemId:item.id,name:item.name,slot:item.slot,nativeLowerRole:role,nativeSourceKey:item.nativePartition?.sourceKey,...extra});
  const resolved = manifest.slots.flatMap(slot => {
    if (excludeSlots.includes(slot.id)) return [];
    const item = itemsById.get(selection[slot.id]);
    if (!item || item.slot !== slot.id) return [];
    if(wholeLower&&slot.id==='legs')return [];
    if(wholeLower&&slot.id==='bottom')return [assetLayer(nativeBottom.originalFull,item,'original-full-lower',{z:slot.z,coversSlots:['bottom','legs'],coversItemIds:[lower.bottom.id,lower.legs.id],nativeOriginal:true,sourceHash:nativeBottom.sourceFileHash})];
    // The wardrobe and review must render the same current artwork. Preserve
    // historical files, but never silently use an old standing variant for a
    // remade item when a native garment controls the pose.
    const variant = variantFor(item);
    const layers = variant.layers?.length ? variant.layers : [{
      src: variant.src, animatedSrc: variant.animatedSrc, svg: variant.svg, z: variant.z, artworkHash: variant.artworkHash,
    }];
    return layers.filter(layer => Boolean(layer.src)).map((layer, index) => ({
      ...layer,
      z: layer.z ?? slot.z,
      key: `${item.id}-${index}`,
      itemId: item.id,
      name: item.name,
      slot: slot.id,
      variantRole: variant.variantRole || (poseId === 'default' ? 'default' : `pose:${poseId}`),
      reviewFamilyHash: item.reviewFamilyHash,
      ...(variant.compatibilityPolicy?{compatibilityPolicy:variant.compatibilityPolicy,compatibilityOwner:item.id,selectedNativeProp}:{}),
      ...(native(item)?{nativeOriginal:true,nativeSourceKey:item.nativePartition.sourceKey,nativeLowerRole:`original-visible-${slot.id}`} : {}),
    }));
  });
  // Only new opt-in metadata participates. Old pools/default presets retain
  // their exact existing layer list. No generated pixels enter native100.
  if(nativeBottom&&currentAi(lower.legs)&&nativeBottom.waistContext?.pixels) {
    resolved.push(assetLayer(nativeBottom.waistContext,lower.bottom,'original-waist-context',{z:29,nativeOriginal:true,sourceHash:nativeBottom.sourceFileHash}));
  }
  const selectedLegItem=itemsById.get(selection.legs),selectedNativeLeg=selectedLegItem?.slot==='legs'?native(selectedLegItem):null;
  if(currentAi(lower.bottom)) {
    const authored=selectedNativeLeg?matchingContactInterface(lower.bottom,selectedNativeLeg,variantFor(lower.bottom).artworkHash):null;
    const support=authored?selectedNativeLeg:nativeLegs,supportItem=authored?selectedLegItem:lower.legs;
    if(authored||support?.hiddenPatch?.pixels)resolved.push(assetLayer(authored||support.hiddenPatch,lower.bottom,'generated-interface',{
      z:31,key:`${lower.bottom.id}-interface-${supportItem.id}`,generatedInterface:true,
      name:`${lower.bottom.name} · 原生像素派生接口`,nativeSourceKey:support.sourceKey,
      nativeSourceItemId:supportItem.id,sourceHash:support.sourceFileHash,
      interfaceForItemId:lower.bottom.id,interfaceForSlot:'bottom',
      provenanceSrc:support.metadataSrc,donorSource:support.source,
      reviewScope:'AI fusion >=98; never native100',
      ...(authored?{compatibilityPolicy:authored.compatibilityPolicy,inputDigest:authored.inputDigest,interfaceInputs:authored.inputs,contactArtworkHash:authored.contactTone.artworkHash,provenanceSrc:authored.provenanceSrc,donorSource:authored.donorSource,algorithmVersion:authored.algorithmVersion}:{}),
    }));
  }
  // C adds only authored hem contact to the selected native lower. It never
  // replaces an arm/pose, changes a native asset, or enters an all-AI preset.
  const selectedBottom=itemsById.get(selection.bottom),selectedNativeBottom=selectedBottom?.slot==='bottom'?native(selectedBottom):null;
  if(!excludeSlots.includes('top')&&currentAi(top)&&selectedNativeBottom){
    const topVariant=variantFor(top),bodyLayer=topVariant.layers?.find(layer=>layer.z===50);
    const upper=bodyLayer?matchingUpperContact(top,selectedNativeBottom,bodyLayer.artworkHash):null;
    if(upper)resolved.push(assetLayer(upper,top,'authored-top-hem-contact',{
      z:49,key:`${top.id}-hem-contact-${selectedBottom.id}`,generatedInterface:true,
      name:`${top.name} · 原生腰线接触`,nativeSourceKey:selectedNativeBottom.sourceKey,
      nativeSourceItemId:selectedBottom.id,sourceHash:selectedNativeBottom.sourceFileHash,
      interfaceForItemId:top.id,interfaceForSlot:'top',compatibilityOwner:top.id,
      compatibilityPolicy:upper.compatibilityPolicy,inputDigest:upper.inputDigest,
      interfaceInputs:upper.inputs,algorithmVersion:upper.algorithmVersion,
      provenanceSrc:upper.provenanceSrc,donorSource:upper.donorSource,
      reviewScope:'AI fusion >=98; never native100',
    }));
  }
  return resolved.sort((a, b) => a.z - b.z);
}
