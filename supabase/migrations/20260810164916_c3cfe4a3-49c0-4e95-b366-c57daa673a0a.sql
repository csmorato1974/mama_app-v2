-- ROLES
CREATE TYPE public.app_role AS ENUM ('administrador','familiar','enfermeria','medico','lectura');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  telefono text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_team(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_write(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('administrador','familiar','enfermeria','medico')
  )
$$;

CREATE POLICY "profiles_select_team" ON public.profiles FOR SELECT TO authenticated USING (public.is_team(auth.uid()) OR id = auth.uid());
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'administrador'));

CREATE POLICY "roles_select_team" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_team(auth.uid()));

-- signup trigger: first user = administrador, rest = familiar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user boolean;
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'administrador'::public.app_role ELSE 'familiar'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PACIENTE
CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  fecha_nacimiento date,
  documento text,
  diagnostico_principal text,
  modalidad_dialisis text,
  grupo_sanguineo text,
  alergias text,
  peso_seco numeric,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;
GRANT ALL ON public.pacientes TO service_role;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pac_select" ON public.pacientes FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "pac_write" ON public.pacientes FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_pac_upd BEFORE UPDATE ON public.pacientes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONTACTOS
CREATE TABLE public.contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text NOT NULL DEFAULT 'otros',
  especialidad text,
  institucion text,
  cargo text,
  telefono text,
  whatsapp text,
  correo text,
  direccion text,
  ciudad text,
  horarios text,
  foto_url text,
  observaciones text,
  lugares_atencion text,
  recomendado_por text,
  motivo_referencia text,
  areas_clinicas text[],
  primera_consulta date,
  ultima_consulta date,
  proxima_consulta date,
  parentesco text,
  responsabilidad text,
  permisos text,
  disponibilidad text,
  es_contacto_emergencia boolean NOT NULL DEFAULT false,
  en_equipo_actual boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contactos TO authenticated;
GRANT ALL ON public.contactos TO service_role;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cont_select" ON public.contactos FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "cont_write" ON public.contactos FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_cont_upd BEFORE UPDATE ON public.contactos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ACTIVIDADES (agenda)
CREATE TABLE public.actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'cita_medica',
  fecha date NOT NULL,
  hora time,
  responsable text,
  estado text NOT NULL DEFAULT 'pendiente',
  prioridad text NOT NULL DEFAULT 'normal',
  notas text,
  recordatorio_min integer,
  contacto_id uuid REFERENCES public.contactos(id) ON DELETE SET NULL,
  lugar text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actividades TO authenticated;
GRANT ALL ON public.actividades TO service_role;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "act_select" ON public.actividades FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "act_write" ON public.actividades FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_act_upd BEFORE UPDATE ON public.actividades FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONSTANTES
CREATE TABLE public.constantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medido_en timestamptz NOT NULL DEFAULT now(),
  presion_sistolica integer,
  presion_diastolica integer,
  frecuencia_cardiaca integer,
  saturacion integer,
  temperatura numeric,
  peso numeric,
  glucemia numeric,
  ingesta_liquidos_ml integer,
  diuresis_ml integer,
  deposiciones text,
  edema text,
  dolor integer,
  nivel_conciencia text,
  apetito text,
  descanso text,
  sintomas text[],
  observaciones text,
  origen text NOT NULL DEFAULT 'manual',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.constantes TO authenticated;
GRANT ALL ON public.constantes TO service_role;
ALTER TABLE public.constantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cons_select" ON public.constantes FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "cons_write" ON public.constantes FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_cons_upd BEFORE UPDATE ON public.constantes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- DIALISIS
CREATE TABLE public.sesiones_dialisis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  hora_inicio time,
  peso_previo numeric,
  peso_posterior numeric,
  concentracion text,
  numero_bolsas integer,
  volumen_infundido_ml integer,
  volumen_drenado_ml integer,
  ultrafiltracion_ml integer,
  duracion_min integer,
  cicladora text,
  alarmas text,
  aspecto_liquido text,
  incidencias text,
  presion_sistolica integer,
  presion_diastolica integer,
  observaciones text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesiones_dialisis TO authenticated;
GRANT ALL ON public.sesiones_dialisis TO service_role;
ALTER TABLE public.sesiones_dialisis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dp_select" ON public.sesiones_dialisis FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "dp_write" ON public.sesiones_dialisis FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_dp_upd BEFORE UPDATE ON public.sesiones_dialisis FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();