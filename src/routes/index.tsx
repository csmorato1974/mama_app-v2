import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!activo) return;
      void navigate({ to: data.user ? "/inicio" : "/auth", replace: true });
    });
    return () => {
      activo = false;
    };
  }, [navigate]);

  return <div className="min-h-screen bg-background" />;
}
