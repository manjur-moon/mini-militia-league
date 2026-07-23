import { createAuthClient } from "better-auth/react";
import { clientEnv } from "./env.js";

export const authClient = createAuthClient({
  baseURL: clientEnv.VITE_AUTH_BASE_URL,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
});
