// ... existing code ...
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const modulePath = "./notifyOnFailure.js";

describe("notifyOnFailure script", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    // @ts-expect-error vitest cleanup
    global.fetch = undefined;
  });

  it("skips when ALERT_WEBHOOK_URL is missing", async () => {
    process.env.ALERT_WEBHOOK_URL = "";
    const mod = await import(modulePath);
    expect(mod).toBeDefined();
    // Ensure fetch was never called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends webhook and includes signature when key is provided", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://example.com/webhook";
    process.env.ALERT_WEBHOOK_SIGNATURE_KEY = "test-key";

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ status: 200 });

    await import(modulePath);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.com/webhook");
    const init = options as RequestInit;
    const headersObj = init.headers as Record<string, string> | Headers;
    const getHeader = (name: string) =>
      headersObj instanceof Headers ? headersObj.get(name) : headersObj?.[name];
    expect(getHeader("Content-Type")).toBe("application/json");
    expect(String(getHeader("X-Signature"))).toMatch(/^sha256=/);
  });
});
// ... existing code ...
