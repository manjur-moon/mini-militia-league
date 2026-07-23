import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  copyShareLink,
  downloadPublicImage,
  sharePublicItem,
} from "./share-actions.js";

describe("social share actions", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    });
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("copies public links through the Clipboard API", async () => {
    await copyShareLink("https://example.com/share");
    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://example.com/share",
    );
  });

  it("uses the legacy copy fallback when the Clipboard API is unavailable", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    document.execCommand = vi.fn(() => true);

    await expect(copyShareLink("https://example.com/legacy")).resolves.toBeUndefined();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("reports a failed legacy copy operation", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    document.execCommand = vi.fn(() => false);

    await expect(copyShareLink("https://example.com/fail")).rejects.toThrow(
      "Unable to copy the public share link.",
    );
  });

  it("falls back to copying when native sharing is unavailable", async () => {
    await expect(
      sharePublicItem({
        title: "Player",
        text: "Verified profile",
        url: "https://example.com/share",
      }),
    ).resolves.toBe("copied");
  });

  it("uses native sharing when available", async () => {
    const share = vi.fn(async () => undefined);
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: share,
    });

    await expect(
      sharePublicItem({
        title: "Weekly MVP",
        text: "Verified MVP result",
        url: "https://example.com/mvp",
      }),
    ).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: "Weekly MVP",
      text: "Verified MVP result",
      url: "https://example.com/mvp",
    });
  });

  it("downloads a verified PNG response and revokes its object URL", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const createObjectURL = vi.fn(() => "blob:qa-artwork");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(["png"], { type: "image/png" }),
      })),
    );

    await downloadPublicImage({
      imageUrl: "https://example.com/card.png",
      filename: "player-card.png",
    });

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:qa-artwork");
    expect(document.querySelector("a[download='player-card.png']")).toBeNull();
  });

  it("rejects unsuccessful and non-PNG artwork responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false })),
    );
    await expect(
      downloadPublicImage({ imageUrl: "/missing", filename: "missing.png" }),
    ).rejects.toThrow("Unable to download the social artwork.");

    globalThis.fetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["html"], { type: "text/html" }),
    });
    await expect(
      downloadPublicImage({ imageUrl: "/invalid", filename: "invalid.png" }),
    ).rejects.toThrow("The server returned an invalid social artwork file.");
  });
});
