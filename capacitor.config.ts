import type { CapacitorConfig } from "@capacitor/cli";

const remoteUrl = process.env["CAPACITOR_SERVER_URL"];

const config: CapacitorConfig = {
  appId: "com.mamita.cuidados",
  appName: "Centro de Cuidados",
  webDir: "android-web",
  server: {
    androidScheme: "https",
    ...(remoteUrl ? { url: remoteUrl } : {}),
  },
};

export default config;
