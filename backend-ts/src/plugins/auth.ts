import type { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyOauth2 from '@fastify/oauth2';
import { env } from '../config/environment.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    readonly sub: string;
    readonly partyId: string;
    readonly scope: readonly string[];
  };
}

const authPlugin = async (fastify: FastifyInstance): Promise<void> => {
  if (env.AUTH_MODE === 'oauth2') {
    // Register OAuth2 for token exchange
    await fastify.register(fastifyOauth2, {
      name: 'keycloak',
      credentials: {
        client: {
          id: env.OAUTH2_CLIENT_ID!,
          secret: env.OAUTH2_CLIENT_SECRET!,
        },
        auth: fastifyOauth2.FLOW.CLIENT_CREDENTIALS,
      },
      startRedirectPath: '/login',
      callbackUri: '/login/callback',
      discovery: {
        issuer: env.OAUTH2_ISSUER_URL!,
      },
    });

    // Register JWT verification
    await fastify.register(fastifyJwt, {
      secret: {
        jwksUri: `${env.OAUTH2_ISSUER_URL}/protocol/openid-connect/certs`,
      },
      decode: { complete: true },
    });

    // Decorator for authenticated routes
    fastify.decorate('authenticate', async (request: FastifyRequest) => {
      try {
        const decoded = await request.jwtVerify();

        // Extract party ID from token claims
        const partyId = (decoded as any).party_id || decoded.sub;
        const scope = Array.isArray((decoded as any).scope)
          ? (decoded as any).scope
          : (decoded as any).scope?.split(' ') ?? [];

        (request as AuthenticatedRequest).user = {
          sub: decoded.sub as string,
          partyId: partyId as string,
          scope,
        };
      } catch (error) {
        throw new AuthenticationError('Invalid or expired token');
      }
    });
  } else {
    // Shared secret mode
    await fastify.register(fastifyJwt, {
      secret: env.SHARED_SECRET!,
    });

    fastify.decorate('authenticate', async (request: FastifyRequest) => {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Missing or invalid authorization header');
      }

      const token = authHeader.substring(7);

      if (token !== env.SHARED_SECRET) {
        throw new AuthenticationError('Invalid shared secret');
      }

      // In shared secret mode, use APP_PROVIDER_PARTY
      (request as AuthenticatedRequest).user = {
        sub: env.AUTH_APP_PROVIDER_BACKEND_USER_NAME!,
        partyId: env.APP_PROVIDER_PARTY!,
        scope: ['admin'],
      };
    });
  }

  // Authorization decorator
  fastify.decorate(
    'authorize',
    (requiredScopes: readonly string[]) => async (request: FastifyRequest) => {
      await (fastify as any).authenticate(request);

      const user = (request as AuthenticatedRequest).user;
      const hasScope = requiredScopes.some((scope) => user.scope.includes(scope));

      if (!hasScope) {
        throw new AuthorizationError(
          `Missing required scope. Required: ${requiredScopes.join(', ')}`
        );
      }
    }
  );
};

export default fastifyPlugin(authPlugin);
