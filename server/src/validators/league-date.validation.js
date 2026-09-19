import { DateTime } from "luxon";
import { z } from "zod";

export const leagueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Match date must use YYYY-MM-DD.")
  .refine((value) => {
    const parsed = DateTime.fromISO(value, { zone: "UTC" });
    return parsed.isValid && parsed.toFormat("yyyy-LL-dd") === value;
  }, "A valid match date is required.");
