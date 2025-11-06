import type { FastifyInstance } from 'fastify';

export const registerHealthRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Liveness probe
  fastify.get('/health', async (request, reply) => {
    return reply.send({ status: 'ok' });
  });

  // Readiness probe
  fastify.get('/ready', async (request, reply) => {
    try {
      // Check database
      await fastify.db.execute(sql`SELECT 1`);

      // Check ledger (if initialized)
      const ledgerStatus = fastify.appProviderParty ? 'ok' : 'not_initialized';

      return reply.send({
        status: 'ready',
        checks: {
          database: 'ok',
          ledger: ledgerStatus,
        },
      });
    } catch (error) {
      return reply.code(503).send({
        status: 'not ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

// Import sql helper
import { sql } from 'drizzle-orm';
