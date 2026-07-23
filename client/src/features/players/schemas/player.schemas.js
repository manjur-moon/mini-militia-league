import { z } from "zod";

const aliasesFromText = z
  .string()
  .max(500)
  .transform((value) =>
    [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ].slice(0, 10),
  );

export const playerFormSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters.").max(80),
  aliasesText: aliasesFromText,
  joinDate: z.string().min(1, "Join date is required."),
  status: z.enum(["active", "inactive"]),
});

export function toPlayerPayload(values) {
  return {
    name: values.name.trim(),
    aliases: values.aliasesText,
    joinDate: new Date(`${values.joinDate}T00:00:00.000Z`).toISOString(),
    status: values.status,
  };
}
