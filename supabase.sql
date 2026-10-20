-- Caso Black · Supabase (SQL Editor > New query > Run)
create table if not exists investigadores (
  id uuid primary key,
  nome text not null check (char_length(nome) between 2 and 80),
  contato text not null check (char_length(contato) between 8 and 120),
  tipo text not null check (tipo in ('email','whatsapp')),
  lgpd boolean not null check (lgpd),
  origem text default 'carta-qr',
  criado_em timestamptz default now()
);
create table if not exists carimbos (
  investigador_id uuid references investigadores(id) on delete cascade,
  estacao smallint not null check (estacao between 1 and 6),  -- 6 = caso resolvido
  via text check (char_length(via) <= 20),
  criado_em timestamptz default now(),
  primary key (investigador_id, estacao)
);
alter table investigadores enable row level security;
alter table carimbos enable row level security;
-- o site (chave anon) só insere; ninguém lê pela chave pública
create policy cad_insert on investigadores for insert to anon with check (true);
create policy car_insert on carimbos for insert to anon with check (true);

-- painel (ver no Table Editor ou exportar CSV; não é exposto ao anon)
create or replace view painel with (security_invoker = true) as
select i.nome, i.contato, i.tipo, i.criado_em,
       count(c.*) filter (where c.estacao <= 5) as carimbos,
       bool_or(c.estacao = 6) is true as resolvido
from investigadores i left join carimbos c on c.investigador_id = i.id
group by i.id order by resolvido desc, carimbos desc, i.criado_em;
revoke all on painel from anon, authenticated;

-- feedback do fim do caso (😕 1 · 🙂 2 · 😍 3)
create table if not exists feedback (
  id uuid primary key,
  investigador_id uuid references investigadores(id) on delete set null,
  nota smallint not null check (nota between 1 and 3),
  faltou text check (char_length(faltou) <= 500),
  origem text check (char_length(origem) <= 30),
  criado_em timestamptz default now()
);
alter table feedback enable row level security;
create policy fb_insert on feedback for insert to anon with check (true);
create or replace view painel_feedback with (security_invoker = true) as
select nota, count(*) as respostas, round(100.0 * count(*) / sum(count(*)) over (), 1) as pct
from feedback group by nota order by nota;
revoke all on painel_feedback from anon, authenticated;

-- Mural da Black: álbum entra com aprovado=false; a equipe do Village marca aprovado=true no Table Editor
create table if not exists mural (
  id uuid primary key,
  investigador_id uuid references investigadores(id) on delete cascade,
  equipe text not null check (char_length(equipe) between 2 and 40),
  arquivo text not null check (arquivo ~ '^[0-9a-f-]{36}\.jpg$'),
  autorizo boolean not null check (autorizo),
  aprovado boolean not null default false,
  criado_em timestamptz default now()
);
alter table mural enable row level security;
create policy mu_insert on mural for insert to anon with check (not aprovado);
create policy mu_select on mural for select to anon using (aprovado);   -- o site só lê o que foi aprovado
-- Storage: bucket público "mural" (Storage > New bucket > Public). Upload anônimo só de .jpg novos:
insert into storage.buckets (id, name, public) values ('mural', 'mural', true) on conflict (id) do nothing;
create policy mu_up on storage.objects for insert to anon with check (bucket_id = 'mural' and name ~ '^[0-9a-f-]{36}\.jpg$');
