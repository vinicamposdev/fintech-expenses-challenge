import { describe, it, expect, afterEach } from 'vitest';
import { buildCorsOptions, parseAllowedOrigins } from './cors.config.js';

type OriginFn = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

/** Runs the CORS origin callback synchronously and returns the verdict. */
function isAllowed(origin: string | undefined, isProduction = false): boolean {
  const originOption = buildCorsOptions(isProduction).origin as OriginFn;
  let allowed: boolean | undefined;
  originOption(origin, (_err, allow) => {
    allowed = allow;
  });
  return allowed === true;
}

const originalFrontendUrl = process.env.FRONTEND_URL;

describe('cors.config', () => {
  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  describe('parseAllowedOrigins', () => {
    it('falls back to the Vite dev server when FRONTEND_URL is unset', () => {
      expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:5173']);
      expect(parseAllowedOrigins('')).toEqual(['http://localhost:5173']);
    });

    it('splits a comma-separated list and trims whitespace', () => {
      expect(
        parseAllowedOrigins('https://a.vercel.app, https://b.vercel.app'),
      ).toEqual(['https://a.vercel.app', 'https://b.vercel.app']);
    });

    it('strips trailing slashes, which never appear in an Origin header', () => {
      expect(parseAllowedOrigins('https://a.vercel.app/')).toEqual([
        'https://a.vercel.app',
      ]);
    });
  });

  describe('origin check', () => {
    it('allows the configured origin', () => {
      process.env.FRONTEND_URL = 'https://app.vercel.app';
      expect(isAllowed('https://app.vercel.app', true)).toBe(true);
    });

    it('allows a configured origin written with a trailing slash', () => {
      process.env.FRONTEND_URL = 'https://app.vercel.app/';
      expect(isAllowed('https://app.vercel.app', true)).toBe(true);
    });

    it('allows every entry of a multi-origin list', () => {
      process.env.FRONTEND_URL =
        'https://app.vercel.app,https://staging.vercel.app';
      expect(isAllowed('https://staging.vercel.app', true)).toBe(true);
    });

    it('allows requests without an Origin header (curl, server-to-server)', () => {
      process.env.FRONTEND_URL = 'https://app.vercel.app';
      expect(isAllowed(undefined, true)).toBe(true);
    });

    it('allows any localhost port outside production', () => {
      process.env.FRONTEND_URL = 'http://localhost:5173';
      expect(isAllowed('http://localhost:5174', false)).toBe(true);
      expect(isAllowed('http://127.0.0.1:5173', false)).toBe(true);
    });

    it('does not allow stray localhost ports in production', () => {
      process.env.FRONTEND_URL = 'https://app.vercel.app';
      expect(isAllowed('http://localhost:5174', true)).toBe(false);
    });

    it('rejects an unknown origin', () => {
      process.env.FRONTEND_URL = 'https://app.vercel.app';
      expect(isAllowed('https://evil.example.com', true)).toBe(false);
    });

    it('rejects a look-alike origin that only shares a suffix', () => {
      process.env.FRONTEND_URL = 'https://app.vercel.app';
      expect(isAllowed('https://evil-app.vercel.app', true)).toBe(false);
    });
  });
});
