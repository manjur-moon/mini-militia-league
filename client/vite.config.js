import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(currentDirectory, "src"),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/@remix-run") ||
            id.includes("node_modules/react-router")
          ) {
            return "react";
          }

          if (
            id.includes("node_modules/better-auth") ||
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform")
          ) {
            return "authentication";
          }

          if (
            id.includes("node_modules/@tanstack") ||
            id.includes("node_modules/axios")
          ) {
            return "query";
          }

          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "threads",
    maxWorkers: 4,
    setupFiles: ["./src/test/setup.js"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "../coverage/client",
      include: [
        "src/components/ui/empty-state.jsx",
        "src/features/auth/components/protected-route.jsx",
        "src/features/rbac/components/role-route.jsx",
        "src/features/auth/schemas/auth.schemas.js",
        "src/features/players/schemas/player.schemas.js",
        "src/features/notifications/components/notification-item.jsx",
        "src/features/ai/components/ai-insight-card.jsx",
        "src/features/sharing/utils/share-actions.js",
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
