import { z } from 'zod';

// Zod schemas for API validation
export const createLicenseRequestSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  duration: z.number().int().positive(),
  metadata: z.record(z.unknown()).optional(),
});

export const renewLicenseRequestSchema = z.object({
  licenseId: z.string().min(1),
  additionalDuration: z.number().int().positive(),
});

export type CreateLicenseRequest = z.infer<typeof createLicenseRequestSchema>;
export type RenewLicenseRequest = z.infer<typeof renewLicenseRequestSchema>;

// Domain types
export interface License {
  readonly contractId: string;
  readonly provider: string;
  readonly user: string;
  readonly productId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly status: 'active' | 'expired' | 'revoked';
  readonly metadata?: Record<string, unknown>;
}

export interface LicenseQuery {
  readonly userId?: string;
  readonly productId?: string;
  readonly status?: 'active' | 'expired' | 'revoked';
  readonly limit?: number;
  readonly offset?: number;
}
