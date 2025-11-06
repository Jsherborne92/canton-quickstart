import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USERNAME || 'cnadmin',
    password: process.env.POSTGRES_PASSWORD || 'supersafe',
    database: process.env.POSTGRES_DATABASE || 'pqs-app-provider',
  },
} satisfies Config;
