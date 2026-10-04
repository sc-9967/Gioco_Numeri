-- Numeri in Tasca: classifiche pubbliche (Supabase / PostgreSQL)
-- Da incollare UNA VOLTA nel "SQL Editor" del progetto Supabase e premere Run.
-- Si puo' rieseguire senza danni (usa "if not exists" / "create or replace").
--
-- Come e' protetto:
--  * le tabelle hanno la sicurezza a livello di riga attiva e NESSUNA regola: dal browser nessuno puo' leggerle o scriverle direttamente;
--  * il browser puo' solo chiamare le 4 funzioni qui sotto (nit_register, nit_new_nick, nit_submit, nit_board);
--  * nessun dato personale: il giocatore ha un identificativo casuale, un segreto (salvato solo come hash) e un nome generato dal server
--    (non si puo' scrivere un nome libero, quindi niente insulti ne' dati personali);
--  * il server decide il giorno (fuso Europa/Roma), scarta punteggi fuori scala, limita la frequenza degli invii.
-- Limite noto: i punteggi arrivano dal browser e il server NON rifa' la partita. Un barare ben fatto, entro il massimo, passa.
-- Per togliere un punteggio sospetto: vedi in fondo, "MODERAZIONE".

-- ---------------------------------------------------------------- tabelle
create table if not exists public.nit_players (
  id          uuid primary key default gen_random_uuid(),
  secret_hash text not null,
  nick        text not null,
  banned      boolean not null default false,
  created_at  timestamptz not null default now(),
  last_submit timestamptz
);

-- una riga per classifica; "max_score" e' il massimo possibile, "enabled" la accende o spegne
create table if not exists public.nit_boards (
  board     text primary key,
  max_score int  not null check (max_score > 0),
  enabled   boolean not null default true
);

create table if not exists public.nit_scores (
  board      text not null references public.nit_boards(board),
  player     uuid not null references public.nit_players(id) on delete cascade,
  day        date not null,
  score      int  not null check (score > 0),
  plays      int  not null default 1,
  updated_at timestamptz not null default now(),
  primary key (board, player, day)
);
create index if not exists nit_scores_day_idx on public.nit_scores (board, day, score desc);

alter table public.nit_players enable row level security;
alter table public.nit_boards  enable row level security;
alter table public.nit_scores  enable row level security;
revoke all on public.nit_players, public.nit_boards, public.nit_scores from public, anon, authenticated;

-- classifiche attive adesso: le due sfide del giorno (stessa partita per tutti)
--   sentiero-giorno: massimo 500 (5 griglie x 100)
--   cassaforte-giorno: massimo 500 + 100x7 tentativi rimasti + 200 = 1400
insert into public.nit_boards (board, max_score, enabled) values
  ('sentiero-giorno', 500, true),
  ('cassaforte-giorno', 1400, true)
on conflict (board) do nothing;

-- ---------------------------------------------------------------- funzioni
create or replace function public.nit_rome_today() returns date
language sql stable as $$ select (now() at time zone 'Europe/Rome')::date $$;

create or replace function public.nit_make_nick() returns text
language plpgsql volatile as $$
declare
  a text[] := array['Veloce','Furbo','Calmo','Audace','Brillante','Gentile','Lucido','Saggio','Rapido','Fiero','Allegro','Tenace','Astuto','Sereno','Vivace','Preciso'];
  b text[] := array['Volpe','Gufo','Lupo','Orso','Falco','Gatto','Delfino','Riccio','Tasso','Cervo','Lontra','Airone','Camoscio','Scoiattolo','Panda','Leone'];
begin
  return a[1 + floor(random() * array_length(a, 1))::int] || ' ' ||
         b[1 + floor(random() * array_length(b, 1))::int] || ' ' ||
         (100 + floor(random() * 900))::int;
end $$;

-- il browser genera un segreto casuale (32-64 caratteri esadecimali) e lo tiene solo sul dispositivo
create or replace function public.nit_register(p_secret text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_nick text;
begin
  if p_secret is null or p_secret !~ '^[0-9a-f]{32,64}$' then raise exception 'segreto non valido'; end if;
  -- freno contro la creazione in massa di giocatori
  if (select count(*) from nit_players where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'troppe richieste, riprova tra poco';
  end if;
  v_nick := nit_make_nick();
  insert into nit_players (secret_hash, nick) values (encode(sha256(convert_to(p_secret, 'UTF8')), 'hex'), v_nick) returning id into v_id;
  return jsonb_build_object('id', v_id, 'nick', v_nick);
end $$;

-- controllo identita' riusato dalle altre funzioni
create or replace function public.nit_auth(p_id uuid, p_secret text) returns public.nit_players
language plpgsql security definer set search_path = public as $$
declare p nit_players;
begin
  select * into p from nit_players where id = p_id and secret_hash = encode(sha256(convert_to(coalesce(p_secret, ''), 'UTF8')), 'hex');
  if not found then raise exception 'giocatore sconosciuto'; end if;
  return p;
end $$;

create or replace function public.nit_new_nick(p_id uuid, p_secret text) returns text
language plpgsql security definer set search_path = public as $$
declare p nit_players; v text;
begin
  p := nit_auth(p_id, p_secret);
  v := nit_make_nick();
  update nit_players set nick = v where id = p.id;
  return v;
end $$;

create or replace function public.nit_submit(p_id uuid, p_secret text, p_board text, p_score int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p nit_players; b nit_boards; v_day date := nit_rome_today(); v_best int;
begin
  p := nit_auth(p_id, p_secret);
  if p.banned then raise exception 'giocatore escluso'; end if;
  select * into b from nit_boards where board = p_board and enabled;
  if not found then raise exception 'classifica non attiva'; end if;
  if p_score is null or p_score < 1 or p_score > b.max_score then raise exception 'punteggio fuori scala'; end if;
  -- massimo un invio ogni 8 secondi per giocatore e 200 invii al giorno
  if p.last_submit is not null and p.last_submit > now() - interval '8 seconds' then raise exception 'troppo veloce'; end if;
  if (select coalesce(sum(plays), 0) from nit_scores where player = p.id and day = v_day) >= 200 then raise exception 'limite giornaliero'; end if;
  update nit_players set last_submit = now() where id = p.id;
  insert into nit_scores (board, player, day, score) values (p_board, p.id, v_day, p_score)
  on conflict (board, player, day) do update
    set score = greatest(nit_scores.score, excluded.score), plays = nit_scores.plays + 1, updated_at = now()
    returning score into v_best;
  return jsonb_build_object('ok', true, 'best_today', v_best);
end $$;

-- p_period: day | week | month | all (giorno e settimana da lunedi' secondo il fuso di Roma)
create or replace function public.nit_board(p_board text, p_period text, p_player uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_today date := nit_rome_today(); v_from date; v_top jsonb; v_me jsonb; v_total int;
begin
  v_from := case p_period
    when 'day'   then v_today
    when 'week'  then date_trunc('week', v_today)::date
    when 'month' then date_trunc('month', v_today)::date
    when 'all'   then date '2000-01-01'
    else null end;
  if v_from is null then raise exception 'periodo non valido'; end if;
  with t as (
    select row_number() over (order by max(s.score) desc, min(s.updated_at) asc) as r, p.id as pid, p.nick, max(s.score) as score
    from nit_scores s join nit_players p on p.id = s.player
    where s.board = p_board and s.day >= v_from and s.day <= v_today and not p.banned
    group by p.id, p.nick
  )
  select (select count(*) from t),
         coalesce((select jsonb_agg(jsonb_build_object('r', r, 'nick', nick, 'score', score, 'me', pid = p_player) order by r) from t where r <= 10), '[]'::jsonb),
         (select jsonb_build_object('r', r, 'score', score, 'nick', nick) from t where pid = p_player)
    into v_total, v_top, v_me;
  return jsonb_build_object('top', v_top, 'me', v_me, 'total', v_total, 'day', v_today);
end $$;

revoke all on function public.nit_register(text), public.nit_auth(uuid, text), public.nit_new_nick(uuid, text),
  public.nit_submit(uuid, text, text, int), public.nit_board(text, text, uuid), public.nit_make_nick(), public.nit_rome_today() from public, anon, authenticated;
grant execute on function public.nit_register(text), public.nit_new_nick(uuid, text),
  public.nit_submit(uuid, text, text, int), public.nit_board(text, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------- MODERAZIONE (a mano, dal SQL Editor)
-- Vedere i primi punteggi di oggi con l'identificativo:
--   select p.id, p.nick, s.board, s.score, s.plays from nit_scores s join nit_players p on p.id = s.player where s.day = (now() at time zone 'Europe/Rome')::date order by s.score desc limit 30;
-- Escludere un giocatore (sparisce da tutte le classifiche):
--   update nit_players set banned = true where id = '...';
-- Togliere un singolo punteggio:
--   delete from nit_scores where player = '...' and board = '...' and day = '2026-10-04';
-- Spegnere una classifica:
--   update nit_boards set enabled = false where board = 'sentiero-giorno';
