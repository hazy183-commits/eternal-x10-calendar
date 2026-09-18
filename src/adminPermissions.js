export const ADMIN_PERMISSIONS=Object.freeze([
  {key:'manage_events',label:'Wydarzenia',description:'Dodawanie i edycja wydarzeń'},
  {key:'manage_epic',label:'Epic RB',description:'Screeny OCR i respawny bossów'},
  {key:'manage_territories',label:'Zamki i Clan Halle',description:'Screeny OCR i właściciele'},
  {key:'manage_siege',label:'Terminy Siege',description:'Zmiana dat oblężeń'},
  {key:'manage_content',label:'Treści strony',description:'Napisy, linki i ogłoszenia'},
  {key:'manage_users',label:'Użytkownicy',description:'Role, statusy i uprawnienia'},
  {key:'manage_discord',label:'Discord',description:'Ustawienia powiadomień'},
]);

export async function loadAdminPermissionContext(supabase){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session)return {profile:null,permissions:new Set(),isOwner:false,canOpenAdmin:false};
  const {data:profile}=await supabase.from('profiles').select('id,nickname,role,status').eq('id',session.user.id).maybeSingle();
  if(!profile||profile.status!=='approved')return {profile:profile||null,permissions:new Set(),isOwner:false,canOpenAdmin:false};
  const isOwner=profile.role==='owner';
  if(isOwner)return {profile,permissions:new Set(ADMIN_PERMISSIONS.map(item=>item.key)),isOwner:true,canOpenAdmin:true};
  const [{data:roleRows},{data:overrides}]=await Promise.all([
    supabase.from('role_permissions').select('permission,enabled').eq('role',profile.role),
    supabase.from('user_permission_overrides').select('permission,enabled').eq('user_id',profile.id),
  ]);
  const values=new Map((roleRows||[]).map(row=>[row.permission,Boolean(row.enabled)]));
  (overrides||[]).forEach(row=>values.set(row.permission,Boolean(row.enabled)));
  const permissions=new Set([...values].filter(([,enabled])=>enabled).map(([key])=>key));
  return {profile,permissions,isOwner:false,canOpenAdmin:permissions.size>0};
}

export function hasAdminPermission(context,key){return Boolean(context?.isOwner||context?.permissions?.has(key))}
