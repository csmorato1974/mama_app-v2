import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CampoClave } from "@/components/CampoClave";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSesion } from "@/hooks/useSesion";
import { supabase } from "@/integrations/supabase/client";
import { MENSAJE_RECUPERACION } from "@/lib/permisos";


export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso al Centro de Cuidados" },
      {
        name: "description",
        content: "Inicia sesión para acceder al seguimiento clínico y asistencial de la paciente.",
      },
      { property: "og:title", content: "Acceso al Centro de Cuidados" },
      {
        property: "og:description",
        content: "Acceso privado del equipo de cuidados: familia, enfermería y equipo médico.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { session } = useSesion();
  const [cargando, setCargando] = useState(false);
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [recuperacionAbierta, setRecuperacionAbierta] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState("");
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);

  async function recuperar() {
    setEnviandoRecuperacion(true);
    await supabase.auth.resetPasswordForEmail(correoRecuperacion.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setEnviandoRecuperacion(false);
    setRecuperacionAbierta(false);
    setCorreoRecuperacion("");
    // Mensaje genérico: no revelamos si el correo existe.
    toast.success(MENSAJE_RECUPERACION);
  }


  useEffect(() => {
    if (session) navigate({ to: "/inicio", replace: true });
  }, [session, navigate]);

  async function entrar() {
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
    setCargando(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message,
      );
      return;
    }
    navigate({ to: "/inicio", replace: true });
  }

  async function registrar() {
    setCargando(true);
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: clave,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nombre },
      },
    });
    setCargando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/inicio", replace: true });
      return;
    }
    toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
  }

  async function entrarConGoogle() {
    const { lovable } = await import("@/integrations/lovable/index");
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      toast.error("No se pudo iniciar sesión con Google.");
      return;
    }
    if (resultado.redirected) return;
    navigate({ to: "/inicio", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <HeartPulse className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-semibold">Centro de Cuidados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acceso privado del equipo de cuidados
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Identifícate</CardTitle>
            <CardDescription>Cada persona accede con su propio rol.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="crear">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="entrar" className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>
                <CampoClave id="clave" valor={clave} onCambio={setClave} />
                <Button className="w-full" onClick={entrar} disabled={cargando || !correo || !clave}>
                  {cargando ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setCorreoRecuperacion(correo);
                    setRecuperacionAbierta(true);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>

              </TabsContent>

              <TabsContent value="crear" className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre y apellido</Label>
                  <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="correo2">Correo</Label>
                  <Input
                    id="correo2"
                    type="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>
                <CampoClave
                  id="clave2"
                  valor={clave}
                  onCambio={setClave}
                  autoComplete="new-password"
                  ayuda="Mínimo 8 caracteres."
                />
                <Button
                  className="w-full"
                  onClick={registrar}
                  disabled={cargando || !correo || !clave || !nombre}
                >
                  {cargando ? <Loader2 className="size-4 animate-spin" /> : "Crear cuenta"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  La primera cuenta creada recibe el rol de administración. El resto queda pendiente de
                  aprobación por administración antes de ver los datos del cuidado.
                </p>

              </TabsContent>
            </Tabs>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={entrarConGoogle}>
              Continuar con Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
