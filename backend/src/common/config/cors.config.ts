import { Logger } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

const logger = new Logger('Cors');

const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;

/**
 * `https://app.vercel.app/` and `https://app.vercel.app` are the same origin,
 * but only the second form ever appears in an `Origin` header.
 */
function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}

/**
 * Origins allowed to call the API, from `FRONTEND_URL`.
 * Accepts a comma-separated list so a deployment can serve, say, the production
 * domain and a staging one at once.
 */
export function parseAllowedOrigins(
  frontendUrl = process.env.FRONTEND_URL,
): string[] {
  const configured = (frontendUrl ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return configured.length > 0 ? configured : ['http://localhost:5173'];
}

export function buildCorsOptions(
  isProduction = process.env.NODE_ENV === 'production',
): CorsOptions {
  const allowedOrigins = parseAllowedOrigins();

  logger.log(
    `Allowed origins: ${allowedOrigins.join(', ')}${
      isProduction ? '' : ' (+ any localhost port in non-production)'
    }`,
  );

  return {
    origin(
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void {
      // Same-origin calls, curl and server-to-server requests send no Origin.
      if (!origin) {
        return callback(null, true);
      }

      const requested = normalizeOrigin(origin);

      if (allowedOrigins.includes(requested)) {
        return callback(null, true);
      }

      // Vite picks the next free port when 5173 is taken, and 127.0.0.1 and
      // localhost are different origins to the browser — allow both in dev.
      if (!isProduction && LOCALHOST_ORIGIN.test(requested)) {
        return callback(null, true);
      }

      logger.warn(
        `Blocked request from origin "${origin}". Add it to FRONTEND_URL (comma-separated) to allow it.`,
      );
      // Reject by omitting the CORS headers rather than throwing a 500.
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400,
  };
}
