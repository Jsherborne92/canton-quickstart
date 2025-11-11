import { z } from 'zod';
import { config } from 'dotenv';

// Load .env file
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_PORT: z.string().default('8080'),

  // Canton/Ledger
  LEDGER_HOST: z.string(),
  LEDGER_PORT: z.string(),
  APP_PROVIDER_PARTY: z.string().optional(),

  // Database (PQS)
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.string(),
  POSTGRES_DATABASE: z.string(),
  POSTGRES_USERNAME: z.string(),
  POSTGRES_PASSWORD: z.string(),

  // Auth
  AUTH_MODE: z.enum(['oauth2', 'shared-secret']),
  AUTH_APP_PROVIDER_BACKEND_USER_NAME: z.string().optional(),

  // OAuth2 (when enabled)
  OAUTH2_ISSUER_URL: z.string().optional(),
  OAUTH2_CLIENT_ID: z.string().optional(),
  OAUTH2_CLIENT_SECRET: z.string().optional(),

  // Shared Secret (when enabled)
  SHARED_SECRET: z.string().optional(),

  // Validator
  VALIDATOR_URI: z.string(),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Environment = z.infer<typeof envSchema>;

export const loadEnvironment = (): Environment => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

export const env = loadEnvironment();
