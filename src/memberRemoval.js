import { confirmLocalized } from './i18nCore.js';
export async function removeMember(supabase, target, confirm = message => confirmLocalized(message)) {
  if (!confirm(`Usunąć „${target.nickname || 'tego członka'}” z klanu?\n\nOsoba zniknie z list członków i straci dostęp do strefy klanu. Historia jej udziału pozostanie zachowana.`)) return false;
  const { error } = await supabase.rpc('remove_clan_member', { target_id: target.id });
  if (error) throw new Error(error.message || 'Nie udało się usunąć członka.');
  return true;
}
