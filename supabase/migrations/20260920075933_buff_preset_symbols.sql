-- Optional recommended symbols travel with the existing private/shared preset.
-- Existing ownership and visibility policies apply unchanged.
alter table public.buff_presets
  add column symbols text not null default ''
  constraint buff_presets_symbols_length check (char_length(symbols) <= 160);
comment on column public.buff_presets.symbols is 'Recommended character symbols / dyes displayed with this buff setup.';
