import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './environment.js';
import * as schema from '../db/schema.js';

export type Database = ReturnType<typeof createDatabase>;

export const createDatabase = () => {
  const connectionString = `postgresql://${env.POSTGRES_USERNAME}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DATABASE}`;

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
};
