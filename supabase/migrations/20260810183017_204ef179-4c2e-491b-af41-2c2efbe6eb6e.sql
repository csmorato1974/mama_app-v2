CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_team(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) $$;

CREATE OR REPLACE FUNCTION private.can_write(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('administrador','familiar','enfermeria','medico')) $$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

REVOKE ALL ON FUNCTION private.is_team(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_write(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_team(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_write(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY act_select ON public.actividades USING (private.is_team(auth.uid()));
ALTER POLICY act_write ON public.actividades USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY adm_select ON public.administraciones USING (private.is_team(auth.uid()));
ALTER POLICY adm_write ON public.administraciones USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY aud_select_admin ON public.auditoria USING (private.has_role(auth.uid(), 'administrador'));
ALTER POLICY cons_select ON public.constantes USING (private.is_team(auth.uid()));
ALTER POLICY cons_write ON public.constantes USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY cont_select ON public.contactos USING (private.is_team(auth.uid()));
ALTER POLICY cont_write ON public.contactos USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY doc_select ON public.documentos USING (private.is_team(auth.uid()));
ALTER POLICY doc_write ON public.documentos USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY ev_select ON public.eventos_clinicos USING (private.is_team(auth.uid()));
ALTER POLICY ev_write ON public.eventos_clinicos USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY gas_select ON public.gastos USING (private.is_team(auth.uid()));
ALTER POLICY gas_write ON public.gastos USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY inv_select ON public.inventario USING (private.is_team(auth.uid()));
ALTER POLICY inv_write ON public.inventario USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY medc_insert ON public.medicamento_cambios WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY medc_select ON public.medicamento_cambios USING (private.is_team(auth.uid()));
ALTER POLICY med_select ON public.medicamentos USING (private.is_team(auth.uid()));
ALTER POLICY med_write ON public.medicamentos USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY pac_select ON public.pacientes USING (private.is_team(auth.uid()));
ALTER POLICY pac_write ON public.pacientes USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY profiles_select_team ON public.profiles USING (private.is_team(auth.uid()) OR id = auth.uid());
ALTER POLICY profiles_update_self ON public.profiles USING (id = auth.uid() OR private.has_role(auth.uid(), 'administrador'));
ALTER POLICY alr_select ON public.reglas_alerta USING (private.is_team(auth.uid()));
ALTER POLICY alr_write ON public.reglas_alerta USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY lab_select ON public.resultados_laboratorio USING (private.is_team(auth.uid()));
ALTER POLICY lab_write ON public.resultados_laboratorio USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY dp_select ON public.sesiones_dialisis USING (private.is_team(auth.uid()));
ALTER POLICY dp_write ON public.sesiones_dialisis USING (private.can_write(auth.uid())) WITH CHECK (private.can_write(auth.uid()));
ALTER POLICY roles_select_team ON public.user_roles USING (user_id = auth.uid() OR private.is_team(auth.uid()));

ALTER POLICY docs_read_team ON storage.objects USING (bucket_id = 'documentos' AND private.is_team(auth.uid()));
ALTER POLICY docs_insert_team ON storage.objects WITH CHECK (bucket_id = 'documentos' AND private.can_write(auth.uid()));
ALTER POLICY docs_update_team ON storage.objects USING (bucket_id = 'documentos' AND private.can_write(auth.uid()));
ALTER POLICY docs_delete_team ON storage.objects USING (bucket_id = 'documentos' AND private.can_write(auth.uid()));

DROP FUNCTION IF EXISTS public.is_team(uuid);
DROP FUNCTION IF EXISTS public.can_write(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);