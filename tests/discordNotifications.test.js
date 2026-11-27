import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('Discord webhook never enters browser code or a public settings write', async () => {
  const source = await readFile(new URL('src/discordReminderSettings.js', root), 'utf8');
  assert.doesNotMatch(source, /webhook_url/);
  assert.doesNotMatch(source, /obDiscordWebhook/);
  assert.match(source, /discord_notification_status/);
  assert.match(source, /preview_discord_notification/);
});

test('Discord migration uses Vault and keeps delivery disabled without a secret', async () => {
  const sql = await readFile(new URL('supabase/migrations/20260918102500_secure_discord_notifications.sql', root), 'utf8');
  assert.match(sql, /vault\.decrypted_secrets/);
  assert.match(sql, /name = 'discord_webhook_url'/);
  assert.match(sql, /if nullif\(btrim\(webhook\), ''\) is null then\s+return 0;/);
  assert.match(sql, /on conflict do nothing/);
  assert.match(sql, /allowed_mentions/);
});

test('Discord planner covers every calendar family and needed RB windows', async () => {
  const sql = await readFile(new URL('supabase/migrations/20260918102500_secure_discord_notifications.sql', root), 'utf8');
  for (const source of ['manual_events', 'manual_bosses', 'static_bosses', 'olympiad', 'sieges', 'clan_halls', 'needed_rb']) {
    assert.match(sql, new RegExp(`\\b${source}\\b`));
  }
  assert.match(sql, /Europe\/Warsaw/);
  assert.match(sql, /'\*\/5 \* \* \* \*'/);
});

test('Discord planner includes the two permanent clan activities', async () => {
  const sql = await readFile(new URL('supabase/migrations/20260926090000_add_clan_activity_schedule.sql', root), 'utf8');
  assert.match(sql, /clan_activities/);
  assert.match(sql, /Klanowe PVP/);
  assert.match(sql, /Ćwiczenia Colloseum/);
  assert.match(sql, /time '20:20'/);
  assert.match(sql, /extract\(isodow from d\) in \(2, 4\)/);
  assert.match(sql, /extract\(isodow from d\) = 3/);
});
