import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CampoClave } from "@/components/CampoClave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/restablecer")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nueva contraseña · Centro de Cuidados" },
      {
        name: "description",
        content: "Establece una nueva contraseña para tu acceso al centro de cuidados.",
      },
      { property: "og:title", content: "Nueva contraseña" },
      { property: "og:description", content: "Recuperación segura de acceso del equipo de cuidados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Restablecer,
});

function Restablecer() {
  const navigate = useNavigate();
  const [listo, setListo] = useState(false);
  const [valido, setValido] = useState(false);
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const esRecuperacion = hash.includes("type=recovery");

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setValido(Boolean(data.session) || esRecuperacion);
      setListo(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === "PASSWORD_RECOVERY" || sesion) {
        setValido(true);
        setListo(true);
      }
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function guardar() {
    if (clave.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (clave !== repetir) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: clave });
    setGuardando(false);
    if (error) {
      toast.error(
        "No se pudo actualizar la contraseña. El enlace puede haber caducado o ya haber sido utilizado.",
      );
      return;
    }
    setClave("");
    setRepetir("");
    toast.success("Contraseña actualizada. Ya puedes usarla para entrar.");
    navigate({ to: "/inicio", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <HeartPulse className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-semibold">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El enlace de recuperación es de un solo uso y caduca.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Establece tu contraseña</CardTitle>
            <CardDescription>Mínimo 8 caracteres. No se guarda ni se muestra en claro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!listo ? (
              <p className="text-sm text-muted-foreground">Comprobando el enlace…</p>
            ) : !valido ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Este enlace no es válido, ya se utilizó o caducó. Solicita uno nuevo desde la pantalla de
                  acceso.
                </p>
                <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
                  Volver al acceso
                </Button>
              </div>
            ) : (
              <>
                <CampoClave
                  id="clave-nueva"
                  label="Nueva contraseña"
                  valor={clave}
                  onCambio={setClave}
                  autoComplete="new-password"
                />
                <CampoClave
                  id="clave-repetir"
                  label="Repite la contraseña"
                  valor={repetir}
                  onCambio={setRepetir}
                  autoComplete="new-password"
                />
                <Button
                  className="w-full"
                  onClick={guardar}
                  disabled={guardando || !clave || !repetir}
                >
                  {guardando ? <Loader2 className="size-4 animate-spin" /> : "Guardar contraseña"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/auth" })}>
                  Cancelar
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
