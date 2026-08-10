CREATE TABLE public.ai_config (
  id boolean NOT NULL PRIMARY KEY DEFAULT true CHECK (id),
  ia_activa boolean NOT NULL DEFAULT true,
  modelo text NOT NULL DEFAULT 'gpt-4o-mini',
  limite_diario_usuario integer NOT NULL DEFAULT 40,
  limite_mensual_usuario integer NOT NULL DEFAULT 400,
  limite_diario_global integer NOT NULL DEFAULT 150,
  limite_mensual_global integer NOT NULL DEFAULT 2000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_config TO authenticated;
GRANT UPDATE ON public.ai_config TO authenticated;
GRANT ALL ON public.ai_config TO service_role;

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY aicfg_select ON public.ai_config FOR SELECT TO authenticated
USING (private.is_team(auth.uid()));

CREATE POLICY aicfg_update ON public.ai_config FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'administrador'))
WITH CHECK (private.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER t_aicfg_upd BEFORE UPDATE ON public.ai_config
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.ai_config (id) VALUES (true);

CREATE TABLE public.ai_usage_log (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  funcion text NOT NULL,
  modelo text NOT NULL,
  tokens_entrada integer NOT NULL DEFAULT 0,
  tokens_salida integer NOT NULL DEFAULT 0,
  tokens_total integer NOT NULL DEFAULT 0,
  coste_estimado_usd numeric(10,6) NOT NULL DEFAULT 0,
  latencia_ms integer NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'ok',
  error_codigo text,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_usage_log_usuario_fecha_idx ON public.ai_usage_log (usuario_id, created_at DESC);
CREATE INDEX ai_usage_log_fecha_idx ON public.ai_usage_log (created_at DESC);

GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY ailog_select ON public.ai_usage_log FOR SELECT TO authenticated
USING (private.is_team(auth.uid()));