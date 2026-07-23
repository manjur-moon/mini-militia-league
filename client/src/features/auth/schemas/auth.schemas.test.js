import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./auth.schemas.js";

describe("authentication schemas", () => {
  it("accepts a valid sign-in payload", () => {
    expect(
      signInSchema.safeParse({
        email: "player@example.com",
        password: "password123",
        rememberMe: true,
      }).success,
    ).toBe(true);
  });

  it("rejects mismatched registration passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Player One",
      email: "player@example.com",
      password: "password123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
  });
});
