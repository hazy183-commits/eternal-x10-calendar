-- Add one direct quest-guide button to the daily digest for each eligible boss.
-- Discord link buttons do not send interactions, so the webhook only needs
-- with_components=true; the standard embed and content remain enabled.
do $migration$
declare
  ddl text;
begin
  select pg_get_functiondef('public.process_discord_daily_digest()'::regprocedure)
    into ddl;

  ddl := replace(
    ddl,
    $old$guide_links text[] := array[]::text[];$old$,
    $new$guide_buttons jsonb := '[]'::jsonb;$new$
  );

  ddl := replace(
    ddl,
    $old$      guide_links := array_append(
        guide_links,
        format(
          '[%s — poradnik questowy](https://orzelbialy.eu/#quest-%s)',
          guide_label,
          guide_slug
        )
      );$old$,
    $new$      guide_buttons := guide_buttons || jsonb_build_array(
        jsonb_build_object(
          'type', 2,
          'style', 5,
          'label', 'Przygotuj się do wejścia: ' || guide_label,
          'url', 'https://orzelbialy.eu/#quest-' || guide_slug
        )
      );$new$
  );

  ddl := replace(
    ddl,
    $old$  message_payload := jsonb_set(
    message_payload,
    '{content}',
    to_jsonb(case
      when cardinality(guide_links) > 0 then
        '🧭 **QUESTY WEJŚCIOWE**' || E'\n' || array_to_string(guide_links, E'\n')
      else ''
    end),
    true
  );$old$,
    $new$  message_payload := jsonb_set(
    message_payload,
    '{content}',
    to_jsonb(case
      when jsonb_array_length(guide_buttons) > 0 then
        '🧭 Przygotuj się do wejścia na bossa:'
      else ''
    end),
    true
  );

  if jsonb_array_length(guide_buttons) > 0 then
    message_payload := jsonb_set(
      message_payload,
      '{components}',
      jsonb_build_array(
        jsonb_build_object('type', 1, 'components', guide_buttons)
      ),
      true
    );
  end if;$new$
  );

  ddl := replace(
    ddl,
    $old$when webhook like '%?%' then '&wait=true'
      else '?wait=true'$old$,
    $new$when webhook like '%?%' then '&with_components=true&wait=true'
      else '?with_components=true&wait=true'$new$
  );

  if position('guide_buttons jsonb' in ddl) = 0
     or position('Przygotuj się do wejścia: ' in ddl) = 0
     or position('with_components=true' in ddl) = 0
     or position('guide_links' in ddl) > 0 then
    raise exception 'Nie udało się bezpiecznie dodać przycisków poradników do dziennego podsumowania Discorda.';
  end if;

  execute ddl;
end
$migration$;
