import { fileURLToPath, URL } from "node:url";
import { createRunnableDevEnvironment, defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// This is a TanStack Start SSR app. Use Start's Vite plugin directly so the
// development server installs the request handler for routes such as `/`.
export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // TanStack Start 1.168 needs a runnable SSR environment in Vite 8 so its
  // development server can import the SSR entry and handle application routes.
  environments: {
    ssr: {
      dev: {
        createEnvironment: (name, config) => createRunnableDevEnvironment(name, config),
      },
    },
  },
});
