import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config
export default defineConfig({
  define: {
    "process.env.ENTRA_CLIENT_ID": JSON.stringify(
      process.env.ENTRA_CLIENT_ID ?? "",
    ),
    "process.env.ENTRA_TENANT_ID": JSON.stringify(
      process.env.ENTRA_TENANT_ID ?? "",
    ),
    "process.env.ENTRA_SCOPES": JSON.stringify(process.env.ENTRA_SCOPES ?? ""),
    "process.env.ENTRA_AUTHORITY": JSON.stringify(
      process.env.ENTRA_AUTHORITY ?? "",
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
