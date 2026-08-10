-- MEDICACION
CREATE TABLE public.medicamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  principio_activo text,
  dosis text,
  frecuencia text,
  horarios text[],
  via text,
  prescriptor_id uuid REFERENCES public.contactos(id) ON DELETE SET NULL,
  fecha_inicio date,
  fecha_suspension date,
  motivo text,
  observaciones text,
  estado text NOT NULL DEFAULT 'activo',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicamentos TO authenticated;
GRANT ALL ON public.medicamentos TO service_role;
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "med_select" ON public.medicamentos FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "med_write" ON public.medicamentos FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_med_upd BEFORE UPDATE ON public.medicamentos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.medicamento_cambios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id uuid NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
  fecha timestamptz NOT NULL DEFAULT now(),
  tipo_cambio text NOT NULL,
  detalle text,
  created_by uuid
);
GRANT SELECT, INSERT ON public.medicamento_cambios TO authenticated;
GRANT ALL ON public.medicamento_cambios TO service_role;
ALTER TABLE public.medicamento_cambios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medc_select" ON public.medicamento_cambios FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "medc_insert" ON public.medicamento_cambios FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

CREATE TABLE public.administraciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicamento_id uuid NOT NULL REFERENCES public.medicamentos(id) ON DELETE CASCADE,
  administrado_en timestamptz NOT NULL DEFAULT now(),
  dosis_administrada text,
  administrado_por text,
  estado text NOT NULL DEFAULT 'administrado',
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.administraciones TO authenticated;
GRANT ALL ON public.administraciones TO service_role;
ALTER TABLE public.administraciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adm_select" ON public.administraciones FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "adm_write" ON public.administraciones FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- DOCUMENTOS
CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'informe',
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  storage_path text,
  mime_type text,
  institucion text,
  profesional_id uuid REFERENCES public.contactos(id) ON DELETE SET NULL,
  texto_ocr text,
  resumen text,
  estado text NOT NULL DEFAULT 'validado',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_select" ON public.documentos FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "doc_write" ON public.documentos FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_doc_upd BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.resultados_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid REFERENCES public.documentos(id) ON DELETE SET NULL,
  fecha date NOT NULL,
  area text NOT NULL DEFAULT 'otros',
  parametro text NOT NULL,
  valor numeric,
  valor_texto text,
  unidad text,
  rango_min numeric,
  rango_max numeric,
  laboratorio text,
  fuera_de_rango boolean,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resultados_laboratorio TO authenticated;
GRANT ALL ON public.resultados_laboratorio TO service_role;
ALTER TABLE public.resultados_laboratorio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_select" ON public.resultados_laboratorio FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "lab_write" ON public.resultados_laboratorio FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));

-- INVENTARIO
CREATE TABLE public.inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto text NOT NULL,
  categoria text NOT NULL DEFAULT 'suministro_dp',
  presentacion text,
  cantidad_recibida numeric NOT NULL DEFAULT 0,
  cantidad_disponible numeric NOT NULL DEFAULT 0,
  consumo_diario numeric,
  lote text,
  caducidad date,
  fecha_entrega date,
  proxima_entrega date,
  stock_minimo numeric,
  proveedor text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventario TO authenticated;
GRANT ALL ON public.inventario TO service_role;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_select" ON public.inventario FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "inv_write" ON public.inventario FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_inv_upd BEFORE UPDATE ON public.inventario FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- GASTOS
CREATE TABLE public.gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  categoria text NOT NULL DEFAULT 'otros',
  concepto text NOT NULL,
  proveedor text,
  importe numeric NOT NULL DEFAULT 0,
  moneda text NOT NULL DEFAULT 'BOB',
  extraordinario boolean NOT NULL DEFAULT false,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE SET NULL,
  notas text,
  estado text NOT NULL DEFAULT 'validado',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos TO authenticated;
GRANT ALL ON public.gastos TO service_role;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gas_select" ON public.gastos FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "gas_write" ON public.gastos FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_gas_upd BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LINEA DE TIEMPO
CREATE TABLE public.eventos_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  fecha_fin date,
  categoria text NOT NULL DEFAULT 'otros',
  titulo text NOT NULL,
  descripcion text,
  especialidad text,
  profesional_id uuid REFERENCES public.contactos(id) ON DELETE SET NULL,
  institucion text,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE SET NULL,
  medicamento_id uuid REFERENCES public.medicamentos(id) ON DELETE SET NULL,
  gravedad text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos_clinicos TO authenticated;
GRANT ALL ON public.eventos_clinicos TO service_role;
ALTER TABLE public.eventos_clinicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev_select" ON public.eventos_clinicos FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "ev_write" ON public.eventos_clinicos FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_ev_upd BEFORE UPDATE ON public.eventos_clinicos FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ALERTAS CONFIGURABLES
CREATE TABLE public.reglas_alerta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  ambito text NOT NULL DEFAULT 'constantes',
  campo text NOT NULL,
  operador text NOT NULL DEFAULT 'fuera_rango',
  valor_min numeric,
  valor_max numeric,
  severidad text NOT NULL DEFAULT 'media',
  activa boolean NOT NULL DEFAULT true,
  mensaje text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reglas_alerta TO authenticated;
GRANT ALL ON public.reglas_alerta TO service_role;
ALTER TABLE public.reglas_alerta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alr_select" ON public.reglas_alerta FOR SELECT TO authenticated USING (public.is_team(auth.uid()));
CREATE POLICY "alr_write" ON public.reglas_alerta FOR ALL TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()));
CREATE TRIGGER t_alr_upd BEFORE UPDATE ON public.reglas_alerta FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AUDITORIA
CREATE TABLE public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla text NOT NULL,
  registro_id uuid,
  accion text NOT NULL,
  usuario_id uuid,
  detalle jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aud_select_admin" ON public.auditoria FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'administrador'));
CREATE POLICY "aud_insert" ON public.auditoria FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_cons_fecha ON public.constantes(medido_en DESC);
CREATE INDEX idx_dp_fecha ON public.sesiones_dialisis(fecha DESC);
CREATE INDEX idx_lab_param ON public.resultados_laboratorio(parametro, fecha DESC);
CREATE INDEX idx_act_fecha ON public.actividades(fecha);
CREATE INDEX idx_gas_fecha ON public.gastos(fecha DESC);
CREATE INDEX idx_ev_fecha ON public.eventos_clinicos(fecha DESC);