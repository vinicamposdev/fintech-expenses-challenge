import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionOptions = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'fintech_expenses',
    };

const ssl =
  process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

export default new DataSource({
  type: 'postgres',
  ...connectionOptions,
  ssl,
  entities: [join(__dirname, '../**/*.entity.ts')],
  migrations: [join(__dirname, '/migrations/*.ts')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
