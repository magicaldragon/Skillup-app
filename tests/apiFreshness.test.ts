import { describe, it, expect, vi } from "vitest";
import { apiService } from "../services/apiService";

describe("API freshness cache-busting", () => {
  it("appends ts param and uses no-store for GET calls", async () => {
    const token = "dummy-token";
    // Provide a token in localStorage for getAuthToken fallback
    localStorage.setItem("skillup_token", token);

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await apiService.users.getUsers();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const urlArg = fetchSpy.mock.calls[0][0] as string;
    const initArg = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(urlArg).toMatch(/\?ts=|&ts=/);
    expect(initArg?.cache).toBe("no-store");

    fetchSpy.mockRestore();
  });
});
