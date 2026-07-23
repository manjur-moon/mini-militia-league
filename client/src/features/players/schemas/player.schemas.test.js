import { describe, expect, it } from "vitest";
import { playerFormSchema, toPlayerPayload } from "./player.schemas.js";

describe("player form schema", () => {
  it("normalizes comma-separated aliases and creates an ISO payload", () => {
    const values = playerFormSchema.parse({
      name: "Moon Player",
      aliasesText: "Moon,  moon, M-Player",
      joinDate: "2026-07-20",
      status: "active",
    });
    const payload = toPlayerPayload(values);

    expect(payload.aliases).toEqual(["Moon", "moon", "M-Player"]);
    expect(payload.joinDate).toBe("2026-07-20T00:00:00.000Z");
  });
});
