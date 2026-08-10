CREATE OR REPLACE FUNCTION private.guard_profiles_update()
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

CREATE OR REPLACE FUNCTION private.audit_row_changes()
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

REVOKE EXECUTE ON FUNCTION private.guard_profiles_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.audit_row_changes() FROM PUBLIC;

DROP TRIGGER IF EXISTS t_profiles_guard ON public.profiles;
CREATE TRIGGER t_profiles_guard BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.guard_profiles_update();

DROP TRIGGER IF EXISTS t_aud_pacientes ON public.pacientes;
CREATE TRIGGER t_aud_pacientes AFTER INSERT OR UPDATE OR DELETE ON public.pacientes
FOR EACH ROW EXECUTE FUNCTION private.audit_row_changes();

DROP TRIGGER IF EXISTS t_aud_profiles ON public.profiles;
CREATE TRIGGER t_aud_profiles AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.audit_row_changes();

DROP TRIGGER IF EXISTS t_aud_user_roles ON public.user_roles;
CREATE TRIGGER t_aud_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION private.audit_row_changes();

DROP FUNCTION IF EXISTS public.guard_profiles_update();
DROP FUNCTION IF EXISTS public.audit_row_changes();