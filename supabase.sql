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
