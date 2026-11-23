-- Add direct Interlude quest-guide links to the daily Discord digest when
-- Baium, Antharas, Valakas, or Frintezza appears in the next 24-hour plan.
do $migration$
declare
  ddl text;
begin
  select pg_get_functiondef('public.process_discord_daily_digest()'::regprocedure)
    into ddl;

  ddl := replace(
    ddl,
    '  events_payload jsonb := ''[]''::jsonb;',
    '  events_payload jsonb := ''[]''::jsonb;
  guide_links text[] := array[]::text[];
  guide_slugs text[] := array[]::text[];
  guide_slug text;
  guide_label text;'
  );

  ddl := replace(
    ddl,
    '      )
    );
  end loop;',
    '      )
    );

    guide_slug := case
      when candidate.event_name ilike ''%baium%'' then ''baium''
      when candidate.event_name ilike ''%antharas%'' then ''antharas''
      when candidate.event_name ilike ''%valakas%'' then ''valakas''
      when candidate.event_name ilike ''%frintezza%'' then ''frintezza''
      else null
    end;
    if guide_slug is not null and array_position(guide_slugs, guide_slug) is null then
      guide_slugs := array_append(guide_slugs, guide_slug);
      guide_label := case guide_slug
        when ''baium'' then ''Baium''
        when ''antharas'' then ''Antharas''
        when ''valakas'' then ''Valakas''
        when ''frintezza'' then ''Frintezza''
      end;
      guide_links := array_append(
        guide_links,
        format(
          ''[%s — poradnik questowy](https://orzelbialy.eu/#quest-%s)'',
          guide_label,
          guide_slug
        )
      );
    end if;
  end loop;'
  );

  ddl := replace(
    ddl,
    '  select net.http_post(',
    '  message_payload := jsonb_set(
    message_payload,
    ''{content}'',
    to_jsonb(case
      when cardinality(guide_links) > 0 then
        ''🧭 **QUESTY WEJŚCIOWE**'' || E''\n'' || array_to_string(guide_links, E''\n'')
      else ''''
    end),
    true
  );

  select net.http_post('
  );

  if position('guide_links text[]' in ddl) = 0
     or position('quest-%s' in ddl) = 0
     or position('QUESTY WEJŚCIOWE' in ddl) = 0 then
    raise exception 'Nie udało się bezpiecznie dodać linków do poradników w dziennym podsumowaniu Discorda.';
  end if;

  execute ddl;
end
$migration$;
