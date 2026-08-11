-- Permite que los roles que participan en el cuidado actualicen la ficha.
-- La consulta mantiene el control por RLS y no expone la ficha a usuarios anónimos.
create policy "equipo de cuidado puede actualizar pacientes"
on public.pacientes
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('administrador', 'familiar', 'enfermeria', 'medico')
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('administrador', 'familiar', 'enfermeria', 'medico')
  )
);
