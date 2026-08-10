import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mamita.cuidados",
  appName: "Centro de Cuidados",
  webDir: ".output/public",
  server: {
    androidScheme: "https",
  },
};

export default config;
