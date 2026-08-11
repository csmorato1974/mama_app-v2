-- Permiso específico para que administración actualice la ficha.
create policy "administrador puede actualizar pacientes"
on public.pacientes
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text = 'administrador'
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text = 'administrador'
  )
);
