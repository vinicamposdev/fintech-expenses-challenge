import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Shared mock API. Tests override single endpoints with
 * `server.use(...)`; `setup.ts` resets those overrides between tests.
 */
export const server = setupServer(...handlers);
