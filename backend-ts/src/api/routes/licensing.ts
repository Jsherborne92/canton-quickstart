import type { FastifyInstance } from 'fastify';
import type { AuthenticatedRequest } from '../../plugins/auth.js';
import {
  createLicenseRequestSchema,
  renewLicenseRequestSchema,
} from '../../domain/licensing/types.js';
import { ValidationError } from '../../utils/errors.js';

export const registerLicensingRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const { licenseService } = fastify;

  if (!licenseService) {
    fastify.log.warn('License service not initialized, skipping route registration');
    return;
  }

  // Create license
  fastify.post(
    '/api/licenses',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['userId', 'productId', 'duration'],
          properties: {
            userId: { type: 'string' },
            productId: { type: 'string' },
            duration: { type: 'integer', minimum: 1, maximum: 365 },
            metadata: { type: 'object' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              contractId: { type: 'string' },
              provider: { type: 'string' },
              user: { type: 'string' },
              productId: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['active', 'expired', 'revoked'] },
            },
          },
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const validation = createLicenseRequestSchema.safeParse(request.body);

      if (!validation.success) {
        throw new ValidationError('Invalid request', validation.error.format());
      }

      const result = await licenseService.createLicense(request.user.partyId, validation.data);

      if (!result.ok) {
        throw result.error;
      }

      return reply.code(201).send(result.value);
    }
  );

  // Get license by ID
  fastify.get(
    '/api/licenses/:contractId',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        params: {
          type: 'object',
          properties: {
            contractId: { type: 'string' },
          },
          required: ['contractId'],
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { contractId } = request.params as { contractId: string };

      const result = await licenseService.getLicense(contractId);

      if (!result.ok) {
        throw result.error;
      }

      return reply.send(result.value);
    }
  );

  // Get user's licenses
  fastify.get(
    '/api/licenses/user/:userId',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { userId } = request.params as { userId: string };

      const result = await licenseService.getUserLicenses(userId);

      if (!result.ok) {
        throw result.error;
      }

      return reply.send({ licenses: result.value });
    }
  );

  // Renew license
  fastify.post(
    '/api/licenses/:licenseId/renew',
    {
      preHandler: (fastify as any).authenticate,
      schema: {
        params: {
          type: 'object',
          properties: {
            licenseId: { type: 'string' },
          },
          required: ['licenseId'],
        },
        body: {
          type: 'object',
          properties: {
            additionalDuration: { type: 'integer', minimum: 1, maximum: 365 },
          },
          required: ['additionalDuration'],
        },
      },
    },
    async (request: AuthenticatedRequest, reply) => {
      const { licenseId } = request.params as { licenseId: string };
      const { additionalDuration } = request.body as { additionalDuration: number };

      const result = await licenseService.renewLicense({
        licenseId,
        additionalDuration,
      });

      if (!result.ok) {
        throw result.error;
      }

      return reply.send(result.value);
    }
  );
};
