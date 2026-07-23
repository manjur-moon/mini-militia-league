import { z } from "zod";

const clientEnvSchema = z.object({
  VITE_API_BASE_URL: z.url(),
  VITE_AUTH_BASE_URL: z.url(),
});

const result = clientEnvSchema.safeParse(import.meta.env);

if (!result.success) {
  const formattedErrors = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid client environment variables:\n${formattedErrors}`);
}

export const clientEnv = Object.freeze(result.data);
