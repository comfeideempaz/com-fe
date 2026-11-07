-- Com Fé!: progresso de cada pessoa com conta (Supabase Auth).
-- Uma linha por usuário; "dados" é o mesmo JSON que o app guarda no aparelho (js/store.js).
-- Cada pessoa só lê e escreve a própria linha (RLS). Visitantes não usam a nuvem.
-- Rode uma vez no SQL Editor do Supabase (ou como migração).

create table if not exists public.comfe_progresso (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  constraint comfe_progresso_tamanho check (pg_column_size(dados) < 2000000)
);

comment on table public.comfe_progresso is 'Com Fé!: progresso de cada usuário (uma linha por pessoa).';

-- atualizado_em sempre pelo relógio do servidor: é a "versão" usada na sincronização.
create or replace function public.comfe_tocar_atualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists comfe_progresso_atualizado on public.comfe_progresso;
create trigger comfe_progresso_atualizado
  before insert or update on public.comfe_progresso
  for each row execute function public.comfe_tocar_atualizado();

alter table public.comfe_progresso enable row level security;

drop policy if exists "comfe: ler o próprio progresso" on public.comfe_progresso;
create policy "comfe: ler o próprio progresso" on public.comfe_progresso
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "comfe: criar o próprio progresso" on public.comfe_progresso;
create policy "comfe: criar o próprio progresso" on public.comfe_progresso
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "comfe: atualizar o próprio progresso" on public.comfe_progresso;
create policy "comfe: atualizar o próprio progresso" on public.comfe_progresso
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "comfe: apagar o próprio progresso" on public.comfe_progresso;
create policy "comfe: apagar o próprio progresso" on public.comfe_progresso
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.comfe_progresso from anon;
grant select, insert, update, delete on public.comfe_progresso to authenticated;
