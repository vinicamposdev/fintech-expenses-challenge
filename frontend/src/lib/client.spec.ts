import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, baseURL, resolveBaseUrl } from './client';
import { server } from '../test/server';
import { api } from '../test/handlers';

describe('resolveBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses VITE_API_URL when it is set', () => {
    expect(resolveBaseUrl('https://api.example.com', true)).toBe('https://api.example.com');
  });

  it('trims whitespace and a trailing slash so paths do not double up', () => {
    expect(resolveBaseUrl('  https://api.example.com/  ', true)).toBe('https://api.example.com');
  });

  it('adds https to a bare host, which axios would otherwise treat as relative', () => {
    expect(resolveBaseUrl('api.example.com', true)).toBe('https://api.example.com');
  });

  it('reads VITE_API_URL from the environment by default', () => {
    vi.stubEnv('VITE_API_URL', 'https://from-env.example.com');

    expect(resolveBaseUrl()).toBe('https://from-env.example.com');
  });

  it('falls back to localhost when the variable is missing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(resolveBaseUrl('', false)).toBe('http://localhost:3000');
  });

  it('treats a blank value as missing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(resolveBaseUrl('   ', false)).toBe('http://localhost:3000');
  });

  it('reports a missing value in production builds instead of silently using localhost', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    resolveBaseUrl('', true);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('VITE_API_URL'));
  });

  it('stays quiet about the fallback in development', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    resolveBaseUrl('', false);

    expect(error).not.toHaveBeenCalled();
  });
});

/**
 * jsdom refuses to navigate, so the redirect is observed through a stubbed
 * `window.location` instead of an "Not implemented" console error.
 */
function stubLocation(pathname: string): { href: string } {
  const location = { pathname, href: `http://localhost${pathname}` };
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: location,
  });
  return location;
}

describe('apiClient', () => {
  const realLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: realLocation,
    });
  });

  it('is configured with the resolved base URL', () => {
    expect(apiClient.defaults.baseURL).toBe(baseURL);
  });

  it('attaches the stored token as a bearer header', async () => {
    localStorage.setItem('accessToken', 'stored-token');
    let authorization: string | null = null;
    server.use(
      http.get(api('/categories'), ({ request }) => {
        authorization = request.headers.get('authorization');
        return HttpResponse.json({ data: [] });
      })
    );

    await apiClient.get('/categories');

    expect(authorization).toBe('Bearer stored-token');
  });

  it('sends no authorization header when signed out', async () => {
    let authorization: string | null = 'unset';
    server.use(
      http.get(api('/categories'), ({ request }) => {
        authorization = request.headers.get('authorization');
        return HttpResponse.json({ data: [] });
      })
    );

    await apiClient.get('/categories');

    expect(authorization).toBeNull();
  });

  it('clears the session and redirects on a 401 from a non-auth endpoint', async () => {
    localStorage.setItem('accessToken', 'expired-token');
    localStorage.setItem('user', '{"id":"user-1"}');
    const location = stubLocation('/transactions');
    server.use(http.get(api('/categories'), () => new HttpResponse(null, { status: 401 })));

    await expect(apiClient.get('/categories')).rejects.toThrow();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(location.href).toBe('/login');
  });

  it('does not redirect again when already on the login page', async () => {
    localStorage.setItem('accessToken', 'expired-token');
    const location = stubLocation('/login');
    server.use(http.get(api('/categories'), () => new HttpResponse(null, { status: 401 })));

    await expect(apiClient.get('/categories')).rejects.toThrow();

    expect(location.href).toBe('http://localhost/login');
  });

  it('keeps the session on a 401 from /auth/*, so the login form can show the error', async () => {
    localStorage.setItem('accessToken', 'stored-token');
    stubLocation('/login');
    server.use(http.post(api('/auth/login'), () => new HttpResponse(null, { status: 401 })));

    await expect(apiClient.post('/auth/login', {})).rejects.toThrow();

    expect(localStorage.getItem('accessToken')).toBe('stored-token');
  });
});
