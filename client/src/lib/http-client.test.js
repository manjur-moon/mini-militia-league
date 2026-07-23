import { describe, expect, it } from "vitest";
import { normalizeApiBaseUrl } from "./http-client.js";

describe("normalizeApiBaseUrl", () => {
  it("removes an API prefix from the configured base URL", () => {
    expect(normalizeApiBaseUrl("http://localhost:5000/api/v1")).toBe(
      "http://localhost:5000",
    );
  });

  it("keeps a backend origin unchanged", () => {
    expect(normalizeApiBaseUrl("http://localhost:5000")).toBe(
      "http://localhost:5000",
    );
  });
});
