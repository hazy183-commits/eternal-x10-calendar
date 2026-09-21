export async function savePollVote(client, {pollId, userId, optionIndex, previousVote}) {
  if (!userId || !Number.isInteger(optionIndex) || optionIndex < 0) throw new Error('Niepoprawny głos.');
  const table = client.from('clan_poll_votes');
  const query = Number.isInteger(previousVote)
    ? table.update({option_index: optionIndex}).eq('poll_id', pollId).eq('user_id', userId)
    : table.insert({poll_id: pollId, user_id: userId, option_index: optionIndex});
  const {data,error} = await query.select('poll_id,option_index').single();
  if (error || !data) throw error || new Error('Nie zapisano głosu. Odśwież ankietę.');
  return data;
}
export async function deletePoll(client, pollId) {
  const {data,error} = await client.from('clan_polls').delete().eq('id',pollId).select('id').single();
  if (error || !data) throw error || new Error('Nie usunięto ankiety.');
  return data;
}
