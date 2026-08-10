-- 1. Paciente: campos adicionales no sensibles
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS correo text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono text,
  ADD COLUMN IF NOT EXISTS resumen_clinico text,
  ADD COLUMN IF NOT EXISTS preferencias text,
  ADD COLUMN IF NOT EXISTS notas_asistenciales text;

-- 2. Perfiles: contacto, estado de acceso y aprobación
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS correo text,
  ADD COLUMN IF NOT EXISTS relacion text,
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS aprobado boolean NOT NULL DEFAULT true;

UPDATE public.profiles p
SET correo = u.email
FROM auth.users u
WHERE u.id = p.id AND p.correo IS NULL;

-- 3. Acceso al equipo: requiere cuenta activa y aprobada
CREATE OR REPLACE FUNCTION private.is_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND p.activo AND p.aprobado
  )
$$;

CREATE OR REPLACE FUNCTION private.can_write(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id
      AND p.activo AND p.aprobado
      AND r.role IN ('administrador','familiar','enfermeria','medico')
  )
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND r.role = _role AND p.activo AND p.aprobado
  )
$$;

-- 4. Nadie que no sea administración puede cambiar estado, aprobación ni correo ajeno
CREATE OR REPLACE FUNCTION public.guard_profiles_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'administrador'::public.app_role) THEN
    IF NEW.id <> OLD.id
       OR NEW.activo IS DISTINCT FROM OLD.activo
       OR NEW.aprobado IS DISTINCT FROM OLD.aprobado THEN
      RAISE EXCEPTION 'No autorizado para modificar el estado de acceso';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_profiles_guard ON public.profiles;
CREATE TRIGGER t_profiles_guard BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profiles_update();

ALTER POLICY profiles_update_self ON public.profiles
  USING ((id = auth.uid()) OR private.has_role(auth.uid(), 'administrador'::public.app_role))
  WITH CHECK ((id = auth.uid()) OR private.has_role(auth.uid(), 'administrador'::public.app_role));

-- 5. Nuevas cuentas quedan pendientes de aprobación
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE first_user boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;

  INSERT INTO public.profiles (id, nombre, correo, activo, aprobado)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email,'@',1)),
    NEW.email,
    true,
    first_user
  )
  ON CONFLICT (id) DO NOTHING;

  IF first_user THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'administrador'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Auditoría automática de cambios sensibles
CREATE OR REPLACE FUNCTION public.audit_row_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  campos text[] := '{}';
  clave text;
  antes jsonb;
  despues jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    antes := to_jsonb(OLD);
    despues := to_jsonb(NEW);
    FOR clave IN SELECT jsonb_object_keys(despues) LOOP
      IF (antes -> clave) IS DISTINCT FROM (despues -> clave)
         AND clave NOT IN ('updated_at') THEN
        campos := campos || clave;
      END IF;
    END LOOP;
    IF array_length(campos, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.auditoria (tabla, registro_id, accion, usuario_id, detalle)
  VALUES (
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN (to_jsonb(OLD)->>'id')::uuid ELSE (to_jsonb(NEW)->>'id')::uuid END,
    TG_OP,
    auth.uid(),
    jsonb_build_object('campos', campos)
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS t_aud_pacientes ON public.pacientes;
CREATE TRIGGER t_aud_pacientes AFTER INSERT OR UPDATE OR DELETE ON public.pacientes
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

DROP TRIGGER IF EXISTS t_aud_profiles ON public.profiles;
CREATE TRIGGER t_aud_profiles AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

DROP TRIGGER IF EXISTS t_aud_user_roles ON public.user_roles;
CREATE TRIGGER t_aud_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();

REVOKE EXECUTE ON FUNCTION public.guard_profiles_update() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_row_changes() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;