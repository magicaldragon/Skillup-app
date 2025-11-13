import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks: stub Firebase modules before importing the service
type FirebaseUserCredential = { user: { getIdToken: () => Promise<string> } };
type SignInFn = (auth: unknown, email: string, password: string) => Promise<FirebaseUserCredential>;
// Avoid nested generics that can confuse the parser: define a clear alias
type SignInMock = ReturnType<
  typeof vi.fn<[unknown, string, string], Promise<FirebaseUserCredential>>
>;
let mockSignIn: SignInMock;

vi.mock("firebase/auth", () => {
  // Initialize a typed Vitest mock so we have .mockResolvedValueOnce/.mockRejectedValueOnce
  mockSignIn = vi.fn<[unknown, string, string], Promise<FirebaseUserCredential>>();
  return {
    signInWithEmailAndPassword: (...args: [unknown, string, string]) => mockSignIn(...args),
  };
});

vi.mock("../frontend/services/firebase", () => ({
  auth: {},
}));

// Import service after mocks to prevent SSR transforms of real Firebase modules
import { authService } from "../frontend/services/authService";

// Removed unused mockGetIdToken
const originalFetch = global.fetch;

describe("authService.login", () => {
  beforeEach(() => {
    // Reset mock state but keep module mocks intact
    vi.clearAllMocks();
    // Reinitialize mockSignIn for each test to avoid stale references
    mockSignIn = vi.fn();
    // Ensure AuthService uses the test seam for sign-in (typed injection, no any)
    (authService as unknown as { signInFn: SignInFn }).signInFn = (auth, email, password) =>
      mockSignIn(auth, email, password) as unknown as Promise<FirebaseUserCredential>;
    localStorage.clear();

    // Default fetch: make backend health check pass in Node
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" || input instanceof URL ? String(input) : (input as Request).url;
      if (String(url).includes("/health")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({ ok: true }),
        } as unknown as Response;
      }
      return Promise.reject(new Error("Fetch not mocked for this URL"));
    }) as unknown as typeof fetch;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("rejects empty fields", async () => {
    const res = await authService.login("", "");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/enter email and password/i);
  });

  it("rejects weak passwords", async () => {
    const res = await authService.login("user@admin.skillup", "123");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/password must be/i);
  });

  it("handles invalid credentials", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("auth/invalid-credential"));
    const res = await authService.login("user@admin.skillup", "Valid123!");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/login|error/i);
  });

  it("locks out after 5 failures within 15 minutes", async () => {
    mockSignIn.mockRejectedValue(new Error("auth/invalid-credential"));
    for (let i = 0; i < 5; i++) {
      await authService.login("user@admin.skillup", "Valid123!");
    }
    const res6 = await authService.login("user@admin.skillup", "Valid123!");
    expect(res6.success).toBe(false);
    expect(res6.message).toMatch(/too many failed attempts/i);
  });

  it("succeeds with valid credentials and backend exchange", async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue("FAKE_ID_TOKEN");
    mockSignIn.mockResolvedValueOnce({ user: { getIdToken: mockGetIdToken } });

    // First call: /health ok, second call: /auth/firebase-login success
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({
          success: true,
          token: "SESSION_TOKEN",
          user: { id: "u1", role: "admin" },
        }),
      } as unknown as Response) as unknown as typeof fetch;

    const res = await authService.login("user@admin.skillup", "Valid123!");
    expect(res.success).toBe(true);
    expect(localStorage.getItem("skillup_token")).toBe("SESSION_TOKEN");
  });

  it("reports network error on fetch failure", async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue("FAKE_ID_TOKEN");
    mockSignIn.mockResolvedValueOnce({ user: { getIdToken: mockGetIdToken } });

    // First call: /health ok, second call: exchange rejects
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      } as unknown as Response)
      .mockRejectedValueOnce(new Error("Network failed")) as unknown as typeof fetch;

    const res = await authService.login("user@admin.skillup", "Valid123!");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/network error/i);
  });
});

describe("authService.login network behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reinitialize mock each test
    mockSignIn = vi.fn<[unknown, string, string], Promise<FirebaseUserCredential>>();
    (authService as unknown as { signInFn: SignInFn }).signInFn = (auth, email, password) =>
      mockSignIn(auth, email, password);
    localStorage.clear();

    // Default fetch: make backend health check pass in Node
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string" || input instanceof URL ? String(input) : (input as Request).url;
      if (url.includes("/health")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({ ok: true }),
        } as unknown as Response;
      }
      return Promise.reject(new Error("Fetch not mocked for this URL"));
    }) as unknown as typeof fetch;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("rejects empty fields", async () => {
    const res = await authService.login("", "");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/enter email and password/i);
  });

  it("rejects weak passwords", async () => {
    const res = await authService.login("user@admin.skillup", "123");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/password must be/i);
  });

  it("handles invalid credentials", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("auth/invalid-credential"));
    const res = await authService.login("user@admin.skillup", "Valid123!");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/login|error/i);
  });

  it("locks out after 5 failures within 15 minutes", async () => {
    mockSignIn.mockRejectedValue(new Error("auth/invalid-credential"));
    for (let i = 0; i < 5; i++) {
      await authService.login("user@admin.skillup", "Valid123!");
    }
    const res6 = await authService.login("user@admin.skillup", "Valid123!");
    expect(res6.success).toBe(false);
    expect(res6.message).toMatch(/too many failed attempts/i);
  });

  it("succeeds with valid credentials and backend exchange", async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue("FAKE_ID_TOKEN");
    mockSignIn.mockResolvedValueOnce({ user: { getIdToken: mockGetIdToken } });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({
          success: true,
          token: "SESSION_TOKEN",
          user: { id: "u1", role: "admin" },
        }),
      } as unknown as Response) as unknown as typeof fetch;

    const res = await authService.login("user@admin.skillup", "Valid123!");
    expect(res.success).toBe(true);
    expect(localStorage.getItem("skillup_token")).toBe("SESSION_TOKEN");
  });

  it("reports network error on fetch failure", async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue("FAKE_ID_TOKEN");
    mockSignIn.mockResolvedValueOnce({ user: { getIdToken: mockGetIdToken } });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      } as unknown as Response)
      .mockRejectedValueOnce(new Error("Network failed")) as unknown as typeof fetch;

    const res = await authService.login("admin@admin.skillup", "Valid123!");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Network error/i);
  });

  it("handles non-OK server responses without false network error", async () => {
    const userCredential: FirebaseUserCredential = {
      user: { getIdToken: vi.fn().mockResolvedValue("FAKE_ID_TOKEN") },
    };
    mockSignIn.mockResolvedValueOnce(userCredential);

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => "application/json" },
        json: async () => ({ success: false, message: "Invalid credentials" }),
      } as unknown as Response) as unknown as typeof fetch;

    const res = await authService.login("admin@admin.skillup", "Invalid123!");
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Invalid credentials|Authentication failed/i);
  });

  it("stores token and user on success", async () => {
    const userCredential: FirebaseUserCredential = {
      user: { getIdToken: vi.fn().mockResolvedValue("FAKE_ID_TOKEN") },
    };
    mockSignIn.mockResolvedValueOnce(userCredential);

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({
          success: true,
          token: "FAKE_SESSION",
          user: { id: "u1", email: "admin@admin.skillup", role: "admin" },
        }),
      } as unknown as Response) as unknown as typeof fetch;

    const res = await authService.login("admin@admin.skillup", "Valid123!");
    expect(res.success).toBe(true);
    expect(localStorage.getItem("skillup_token")).toBe("FAKE_SESSION");
  });
});
