import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks: stub Firebase modules before importing the service
let mockSignIn: any;
vi.mock('firebase/auth', () => {
  mockSignIn = vi.fn();
  return {
    signInWithEmailAndPassword: (...args: any[]) => mockSignIn(...args),
  };
});

vi.mock('../frontend/services/firebase', () => ({
  auth: {},
}));

// Import service after mocks to prevent SSR transforms of real Firebase modules
import { authService } from '../frontend/services/authService';

const mockGetIdToken = vi.fn().mockResolvedValue('FAKE_ID_TOKEN');

const originalFetch = global.fetch;

describe('authService.login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = originalFetch;
  });

  it('rejects empty fields', async () => {
    const res = await authService.login('', '');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/enter email and password/i);
  });

  it('rejects weak passwords', async () => {
    const res = await authService.login('user@admin.skillup', '123');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/password must be/i);
  });

  it('handles invalid credentials', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('auth/invalid-credential'));
    const res = await authService.login('user@admin.skillup', 'Valid123!');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/login|error/i);
  });

  it('locks out after 5 failures within 15 minutes', async () => {
    mockSignIn.mockRejectedValue(new Error('auth/invalid-credential'));
    for (let i = 0; i < 5; i++) {
      await authService.login('user@admin.skillup', 'Valid123!');
    }
    const res6 = await authService.login('user@admin.skillup', 'Valid123!');
    expect(res6.success).toBe(false);
    expect(res6.message).toMatch(/too many failed attempts/i);
  });

  it('succeeds with valid credentials and backend exchange', async () => {
    mockSignIn.mockResolvedValueOnce({ user: { getIdToken: mockGetIdToken } });
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, token: 'SESSION_TOKEN', user: { id: 'u1', role: 'admin' } }),
    } as any);

    const res = await authService.login('user@admin.skillup', 'Valid123!');
    expect(res.success).toBe(true);
    expect(localStorage.getItem('skillup_token')).toBe('SESSION_TOKEN');
  });

  it('reports network error on fetch failure', async () => {
    mockSignIn.mockResolvedValueOnce({ user: { getIdToken: mockGetIdToken } });
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network failed'));
    const res = await authService.login('user@admin.skillup', 'Valid123!');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/network error/i);
  });
});

describe('authService.login network behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows a network error only when fetch rejects (offline/CORS)', async () => {
    const userCredential = { user: { getIdToken: vi.fn().mockResolvedValue('FAKE_ID_TOKEN') } };
    mockSignIn.mockResolvedValueOnce(userCredential as any);

    global.fetch = vi.fn().mockRejectedValueOnce(new TypeError('NetworkError'));

    const res = await authService.login('admin@admin.skillup', 'Valid123!');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Network error/i);
  });

  it('handles non-OK server responses without false network error', async () => {
    const userCredential = { user: { getIdToken: vi.fn().mockResolvedValue('FAKE_ID_TOKEN') } };
    mockSignIn.mockResolvedValueOnce(userCredential as any);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Invalid credentials' }),
    } as any);

    const res = await authService.login('admin@admin.skillup', 'Invalid123!');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Invalid credentials|Authentication failed/i);
  });

  it('stores token and user on success', async () => {
    const userCredential = { user: { getIdToken: vi.fn().mockResolvedValue('FAKE_ID_TOKEN') } };
    mockSignIn.mockResolvedValueOnce(userCredential as any);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, token: 'FAKE_SESSION', user: { id: 'u1', email: 'admin@admin.skillup', role: 'admin' } }),
    } as any);

    const res = await authService.login('admin@admin.skillup', 'Valid123!');
    expect(res.success).toBe(true);
    expect(localStorage.getItem('skillup_token')).toBe('FAKE_SESSION');
  });
});