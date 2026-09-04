import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions,
  ssl,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
