-- Refuerza el permiso de edición de la ficha para administradores.
-- Se mantiene separado de pac_write para no ampliar permisos a otros roles.
drop policy if exists "admin puede actualizar pacientes" on public.pacientes;

create policy "admin puede actualizar pacientes"
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
