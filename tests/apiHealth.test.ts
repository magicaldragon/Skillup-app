import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiService } from "../services/apiService";

let originalFetch: typeof fetch;

describe("healthAPI.checkHealth", () => {
  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.setItem("skillup_token", "TEST_TOKEN");
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (String(url).endsWith("/api/health") || String(url).endsWith("/health")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
          headers: { get: () => "application/json" },
        } as unknown as Response;
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    localStorage.clear();
    global.fetch = originalFetch;
  });

  it("returns ok when health endpoint responds with 200", async () => {
    const res = await apiService.health.checkHealth();
    expect(res).toEqual({ ok: true });
  });

  it("throws when token is missing", async () => {
    localStorage.clear();
    await expect(apiService.health.checkHealth()).rejects.toThrow(/No authentication token/i);
  });
});
