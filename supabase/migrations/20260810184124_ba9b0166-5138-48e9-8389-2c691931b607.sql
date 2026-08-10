CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE first_user boolean;
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  IF first_user THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'administrador'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE POLICY "roles_admin_insert" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'administrador'));

CREATE POLICY "roles_admin_update" ON public.user_roles
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'administrador'))
WITH CHECK (private.has_role(auth.uid(), 'administrador'));

CREATE POLICY "roles_admin_delete" ON public.user_roles
FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'administrador'));

GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;