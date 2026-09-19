import { signupIdentity } from './clanEventFeed.js';

export async function saveCalendarSignup(client, event, response) {
  if (!['yes', 'maybe', 'no'].includes(response)) throw new Error('Nieprawidłowa odpowiedź.');
  if (!event?.id || !(new Date(event.endAt).getTime() > Date.now())) {
    throw new Error('To wydarzenie już się zakończyło.');
  }
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth?.user) throw new Error('Zaloguj się ponownie, aby zapisać odpowiedź.');
  const user = auth.user;
  const { data: profile, error: profileError } = await client.from('profiles')
    .select('nickname,character_class,character_level,subclass,party_role').eq('id', user.id).maybeSingle();
  if (profileError) throw new Error('Nie udało się pobrać profilu. Spróbuj ponownie.');
  const identity = signupIdentity(event.id);
  const row = {
    ...identity, user_id: user.id,
    nickname: profile?.nickname || user.user_metadata?.nickname || user.email?.split('@')[0] || 'Gracz',
    response, character_class: profile?.character_class || null,
    character_level: profile?.character_level || null, subclass: profile?.subclass || null,
    party_role: profile?.party_role || null, updated_at: new Date().toISOString(),
  };
  const { data, error } = await client.from('event_signups')
    .upsert(row, { onConflict: identity.event_id ? 'event_id,user_id' : 'schedule_key,user_id' })
    .select('event_id,schedule_key,user_id,nickname,response,character_class,character_level,party_role').single();
  if (error || !data) throw new Error('Nie udało się zapisać odpowiedzi. Spróbuj ponownie.');
  return data;
}
