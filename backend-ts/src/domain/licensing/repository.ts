import type { Database } from '../../config/database.js';
import type { License, LicenseQuery } from './types.js';
import type { Result } from '../../utils/result.js';
import { ok, err } from '../../utils/result.js';
import { DomainError } from '../../utils/errors.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { activeContracts } from '../../db/schema.js';

export interface LicenseRepository {
  readonly findById: (contractId: string) => Promise<Result<License | null, DomainError>>;
  readonly findByQuery: (query: LicenseQuery) => Promise<Result<readonly License[], DomainError>>;
  readonly findActiveByUser: (userId: string) => Promise<Result<readonly License[], DomainError>>;
}

export const createLicenseRepository = (db: Database): LicenseRepository => {
  const LICENSE_TEMPLATE_ID = 'Quickstart.Licensing:License';

  const mapToLicense = (row: any): License => {
    const args = row.createArguments as any;

    return {
      contractId: row.contractId,
      provider: args.provider,
      user: args.user,
      productId: args.productId,
      expiresAt: new Date(args.expiresAt),
      createdAt: new Date(row.createdAt),
      status: new Date(args.expiresAt) > new Date() ? 'active' : 'expired',
      metadata: args.metadata,
    };
  };

  return {
    findById: async (contractId) => {
      try {
        const result = await db
          .select()
          .from(activeContracts)
          .where(
            and(
              eq(activeContracts.contractId, contractId),
              eq(activeContracts.templateId, LICENSE_TEMPLATE_ID)
            )
          )
          .limit(1);

        if (result.length === 0) {
          return ok(null);
        }

        return ok(mapToLicense(result[0]!));
      } catch (error) {
        return err(new DomainError('Failed to fetch license', 'DB_ERROR', 500, error));
      }
    },

    findByQuery: async (query) => {
      try {
        let queryBuilder = db
          .select()
          .from(activeContracts)
          .where(eq(activeContracts.templateId, LICENSE_TEMPLATE_ID));

        if (query.userId) {
          queryBuilder = queryBuilder.where(
            sql`${activeContracts.createArguments}->>'user' = ${query.userId}`
          ) as any;
        }

        if (query.productId) {
          queryBuilder = queryBuilder.where(
            sql`${activeContracts.createArguments}->>'productId' = ${query.productId}`
          ) as any;
        }

        queryBuilder = queryBuilder
          .orderBy(desc(activeContracts.createdAt))
          .limit(query.limit ?? 50)
          .offset(query.offset ?? 0) as any;

        const results = await queryBuilder;
        const licenses = results.map(mapToLicense);

        // Filter by status if requested
        if (query.status) {
          return ok(licenses.filter((l) => l.status === query.status));
        }

        return ok(licenses);
      } catch (error) {
        return err(new DomainError('Failed to query licenses', 'DB_ERROR', 500, error));
      }
    },

    findActiveByUser: async (userId) => {
      try {
        const result = await db
          .select()
          .from(activeContracts)
          .where(
            and(
              eq(activeContracts.templateId, LICENSE_TEMPLATE_ID),
              sql`${activeContracts.createArguments}->>'user' = ${userId}`
            )
          )
          .orderBy(desc(activeContracts.createdAt));

        const licenses = result.map(mapToLicense);
        return ok(licenses.filter((l) => l.status === 'active'));
      } catch (error) {
        return err(new DomainError('Failed to query active licenses', 'DB_ERROR', 500, error));
      }
    },
  };
};
