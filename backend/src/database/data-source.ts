import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = new Logger('Database');

/** Strips the password from a connection string so it's safe to log. */
function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return '<unparseable DATABASE_URL>';
  }
}

// A missing DATABASE_URL in production used to fall through to the
// localhost defaults below and retry-loop against nothing with a bare
// ECONNREFUSED — no indication *why*. Fail fast with an actionable message
// instead: the Railway service almost certainly just needs DATABASE_URL set
// to the Neon connection string (Neon dashboard, or `neon connection-string`).
if (
  process.env.NODE_ENV === 'production' &&
  !process.env.DATABASE_URL &&
  !process.env.DB_HOST
) {
  throw new Error(
    'DATABASE_URL is not set. In production this must be the Postgres connection string ' +
      '(e.g. from Neon) — set it as a variable on the Railway service. ' +
      'Without it the app falls back to a localhost database that does not exist in the container.',
  );
}

// Railway's Postgres plugin (and most managed Postgres providers) only expose
// a connection string via DATABASE_URL — it never sets DB_HOST/DB_USERNAME/etc,
// so those discrete vars silently fell back to the localhost defaults in
// production and the app tried to connect to nothing. Prefer DATABASE_URL when
// set; keep the discrete vars as the local-dev fallback (see .env.example).
const connectionOptions = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'fintech_expenses',
    };

// Railway's private network (service-to-service DATABASE_URL, the default
// inside one project) doesn't need TLS; its public TCP proxy does, with a
// certificate that isn't chained to a public CA. Opt in via DB_SSL=true.
const ssl =
  process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

if (process.env.DATABASE_URL) {
  logger.log(
    `Connecting via DATABASE_URL: ${redactUrl(process.env.DATABASE_URL)}`,
  );
} else {
  logger.log(
    `Connecting via DB_* vars: host=${connectionOptions.host} port=${connectionOptions.port} ` +
      `database=${connectionOptions.database} username=${connectionOptions.username} ssl=${!!ssl}`,
  );
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions,
  ssl,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
