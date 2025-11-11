import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/environment.js';
import { createDatabase } from './config/database.js';
import { createLedgerConfig, createLedgerConnection } from './config/ledger.js';
import authPlugin from './plugins/auth.js';
import { errorHandler } from './api/middleware/error-handler.js';
import { registerHealthRoutes } from './api/routes/health.js';
import { registerLicensingRoutes } from './api/routes/licensing.js';
import { createLicenseRepository } from './domain/licensing/repository.js';
import { createLicenseService } from './domain/licensing/service.js';
import { createLedgerClient } from './ledger/client.js';
import type { LicenseService } from './domain/licensing/service.js';
import type { Database } from './config/database.js';
import type { LedgerConfig } from './config/ledger.js';

export const createServer = async () => {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                colorize: true,
              },
            }
          : undefined,
    },
    disableRequestLogging: env.NODE_ENV === 'production',
  });

  // Register CORS
  await fastify.register(cors, {
    origin:
      env.NODE_ENV === 'development'
        ? '*'
        : ['http://app-provider.localhost:3000', 'http://app-provider.localhost:5173'],
    credentials: true,
  });

  // Initialize database
  const db = createDatabase();
  fastify.decorate('db', db);

  // Initialize ledger config
  const ledgerConfig = createLedgerConfig();
  fastify.decorate('ledgerConfig', ledgerConfig);

  // APP_PROVIDER_PARTY will be set at runtime via start.sh
  fastify.decorate('appProviderParty', env.APP_PROVIDER_PARTY ?? null);

  // Initialize repositories and services
  const licenseRepository = createLicenseRepository(db);

  // Will be initialized after APP_PROVIDER_PARTY is available
  fastify.decorate('licenseService', null);

  // Register auth plugin
  await fastify.register(authPlugin);

  // Add hook to initialize services after APP_PROVIDER_PARTY is set
  fastify.addHook('onReady', async () => {
    if (!fastify.appProviderParty) {
      fastify.log.warn('APP_PROVIDER_PARTY not set, ledger operations will fail');
      return;
    }

    // Get token for app provider (in OAuth2 mode)
    let token: string;
    if (env.AUTH_MODE === 'oauth2') {
      // Use client credentials to get token
      const oauth2 = (fastify as any).keycloak;
      try {
        const tokenResponse = await oauth2.getAccessTokenUsingClientCredentials();
        token = tokenResponse.access_token;
      } catch (error) {
        fastify.log.error(error, 'Failed to get access token from OAuth2');
        throw error;
      }
    } else {
      token = env.SHARED_SECRET!;
    }

    const ledgerResult = await createLedgerConnection(ledgerConfig, token);

    if (!ledgerResult.ok) {
      fastify.log.error(ledgerResult.error, 'Failed to connect to ledger');
      throw ledgerResult.error;
    }

    const ledgerClient = createLedgerClient(ledgerResult.value, fastify.appProviderParty);

    const licenseService = createLicenseService(ledgerClient, licenseRepository);
    fastify.decorate('licenseService', licenseService);

    fastify.log.info('Services initialized successfully');
  });

  // Register routes
  await fastify.register(registerHealthRoutes);
  await fastify.register(registerLicensingRoutes);

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  return fastify;
};

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
    ledgerConfig: LedgerConfig;
    appProviderParty: string | null;
    licenseService: LicenseService | null;
    authenticate: (request: FastifyRequest) => Promise<void>;
    authorize: (scopes: readonly string[]) => (request: FastifyRequest) => Promise<void>;
  }
}
