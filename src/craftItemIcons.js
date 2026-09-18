const ICON_API='/api/interlude/items/';
const cache=new Map();
const clean=v=>String(v||'').trim();
function candidates(file){const f=clean(file).replace(/^.*[\\/]/,'');if(!f)return[];return [`/assets/interlude/icons/${f}`,`https://resources.elmorelab.com/images/icons/${f}`,`https://resources.elmorelab.com/images/${f}`]}
export async function getInterludeItemIcon(id,name=''){const key=`${id||''}:${name}`;if(cache.has(key))return cache.get(key);let iconFile='';if(id){try{const r=await fetch(`${ICON_API}${encodeURIComponent(id)}`);if(r.ok){const d=await r.json();iconFile=d?.iconFile||d?.icon||d?.icon_file||d?.data?.iconFile||''}}catch{}}const out={iconFile,candidates:candidates(iconFile)};cache.set(key,out);return out}
export function installIconWithFallback(node,urls=[],fallback='⚒'){if(!node)return;let i=0;const next=()=>{if(i>=urls.length){node.textContent=fallback;return}const img=new Image();img.alt='';img.loading='lazy';img.onload=()=>{node.replaceChildren(img)};img.onerror=next;img.src=urls[i++]};next()}
