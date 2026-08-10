alter table public.gastos
  add column if not exists realizado_por uuid references public.profiles(id) on delete set null;

create index if not exists gastos_realizado_por_idx on public.gastos(realizado_por);
