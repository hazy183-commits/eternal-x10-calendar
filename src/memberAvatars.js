const BUCKET = 'member-avatars';
const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function avatarMarkup(profile = {}) {
  return `<span class="member-avatar" data-avatar-path="${esc(profile.avatar_path || '')}" aria-hidden="true">${esc(Array.from(profile.nickname || '?')[0].toUpperCase())}</span>`;
}
export async function hydrateAvatars(supabase, root) {
  const nodes = [...root.querySelectorAll('[data-avatar-path]')].filter(x => x.dataset.avatarPath);
  const paths = [...new Set(nodes.map(x => x.dataset.avatarPath))];
  if (!paths.length) return;
  try {
    const {data,error} = await supabase.storage.from(BUCKET).createSignedUrls(paths,300);
    if (error) return;
    for (const node of nodes) {
      const match = data?.find(x => x.path === node.dataset.avatarPath && x.signedUrl);
      if (!match || !node.isConnected) continue;
      const path = node.dataset.avatarPath, img = new Image(); img.alt='';
      img.onload = () => { if (node.isConnected && node.dataset.avatarPath === path) node.replaceChildren(img); };
      img.src = match.signedUrl;
    }
  } catch { /* Initials remain visible if a signed URL cannot be loaded. */ }
}
export async function prepareAvatar(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file?.type)) throw new Error('Wybierz obraz JPG, PNG lub WebP.');
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Obraz może mieć maksymalnie 5 MB.');
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error('Nie można odczytać tego obrazu. Wybierz inny plik.'); }
  try {
    const canvas = document.createElement('canvas'); canvas.width=canvas.height=256;
    const side = Math.min(bitmap.width,bitmap.height);
    if (!side) throw new Error('Obraz jest pusty.');
    canvas.getContext('2d').drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/webp',0.85));
    if (!blob || blob.type !== 'image/webp') throw new Error('Przeglądarka nie obsługuje zapisu miniatur.');
    return blob;
  } finally { bitmap.close(); }
}
let disposePrevious;
export function mountAvatarEditor(supabase, parent) {
  disposePrevious?.();
  const box=document.createElement('section');box.className='member-avatar-editor';
  box.innerHTML=`<div class="avatar-preview">${avatarMarkup()}</div><div><h4>MINIATURA PROFILU</h4><p>Widoczna dla członków klanu. JPG, PNG lub WebP do 5 MB. Obraz przytniemy do kwadratu.</p><label class="avatar-file-label">Wybierz obraz<input type="file" accept="image/jpeg,image/png,image/webp" data-avatar-file></label><div class="avatar-actions"><button type="button" data-avatar-save disabled>ZAPISZ MINIATURĘ</button><button type="button" data-avatar-cancel hidden>ANULUJ</button><button type="button" data-avatar-remove hidden>USUŃ MINIATURĘ</button></div><p data-avatar-message role="status"></p></div>`;
  parent.prepend(box);
  const q=s=>box.querySelector(s),message=text=>q('[data-avatar-message]').textContent=text;
  let profile=null,userId=null,pending=null,previewUrl=null,busy=false,version=0;
  const release=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null};
  const controls=()=>{q('[data-avatar-file]').disabled=busy||!userId;q('[data-avatar-save]').disabled=busy||!pending;q('[data-avatar-cancel]').hidden=!pending;q('[data-avatar-cancel]').disabled=busy;q('[data-avatar-remove]').hidden=!profile?.avatar_path;q('[data-avatar-remove]').disabled=busy};
  const show=()=>{release();q('.avatar-preview').innerHTML=avatarMarkup(profile||{});hydrateAvatars(supabase,box);controls()};
  async function load(){const v=++version;pending=null;userId=null;profile=null;show();try{const {data:{user}}=await supabase.auth.getUser();if(v!==version||!user)return;const {data,error}=await supabase.from('profiles').select('id,nickname,avatar_path,status,removed_at').eq('id',user.id).single();if(v!==version)return;if(error)throw error;if(data.status!=='approved'||data.removed_at)return;profile=data;userId=user.id;show()}catch{if(v===version)message('Nie udało się wczytać miniatury. Odśwież stronę.')}}
  q('[data-avatar-file]').onchange=async event=>{const file=event.target.files?.[0];if(!file)return;const v=++version;pending=null;busy=true;controls();message('Przygotowywanie podglądu…');try{const blob=await prepareAvatar(file);if(v!==version)return;pending=blob;release();previewUrl=URL.createObjectURL(blob);const img=new Image();img.alt='Podgląd nowej miniatury';img.src=previewUrl;q('.avatar-preview').replaceChildren(img);message('Podgląd gotowy. Kliknij „Zapisz miniaturę”.')}catch(error){if(v===version){show();message(error.message)}}finally{if(v===version){busy=false;controls()}event.target.value=''}};
  q('[data-avatar-cancel]').onclick=()=>{++version;pending=null;show();message('')};
  async function save(remove=false){if(busy||!userId||(!remove&&!pending))return;busy=true;controls();message('Zapisywanie…');const id=userId,oldPath=profile?.avatar_path,newPath=remove?null:`${id}/${crypto.randomUUID()}.webp`,v=version;let uploaded=false;
    try{
      if(newPath){const {error}=await supabase.storage.from(BUCKET).upload(newPath,pending,{contentType:'image/webp',upsert:false});if(error)throw error;uploaded=true;}
      if(v!==version)throw new Error('Sesja została zmieniona.');
      const {data,error}=await supabase.from('profiles').update({avatar_path:newPath}).eq('id',id).select('id,nickname,avatar_path,status,removed_at').single();
      if(error||!data)throw error||new Error('Brak potwierdzenia zapisu.');
      if(oldPath)await supabase.storage.from(BUCKET).remove([oldPath]).catch(()=>{});
      if(v===version){profile=data;pending=null;show();message(remove?'Miniatura usunięta.':'Miniatura zapisana.');window.dispatchEvent(new Event('orzel:avatar-updated'));}
    }catch{if(uploaded)await supabase.storage.from(BUCKET).remove([newPath]).catch(()=>{});if(v===version)message('Nie udało się zapisać miniatury. Spróbuj ponownie.');}
    finally{if(v===version){busy=false;controls()}}
  }
  q('[data-avatar-save]').onclick=()=>save();q('[data-avatar-remove]').onclick=()=>save(true);
  const auth=supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN'){++version;busy=false;setTimeout(load,0)}});
  disposePrevious=()=>{++version;release();auth?.data?.subscription?.unsubscribe();};
  controls();load();
}
