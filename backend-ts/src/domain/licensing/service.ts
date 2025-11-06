import type { LedgerClient } from '../../ledger/client.js';
import type { LicenseRepository } from './repository.js';
import type { CreateLicenseRequest, RenewLicenseRequest, License } from './types.js';
import type { Result } from '../../utils/result.js';
import { ok, err } from '../../utils/result.js';
import { DomainError, NotFoundError, ValidationError } from '../../utils/errors.js';

export interface LicenseService {
  readonly createLicense: (
    providerParty: string,
    request: CreateLicenseRequest
  ) => Promise<Result<License, DomainError>>;

  readonly renewLicense: (request: RenewLicenseRequest) => Promise<Result<License, DomainError>>;

  readonly getLicense: (contractId: string) => Promise<Result<License, DomainError>>;

  readonly getUserLicenses: (userId: string) => Promise<Result<readonly License[], DomainError>>;
}

export const createLicenseService = (
  ledgerClient: LedgerClient,
  repository: LicenseRepository
): LicenseService => {
  return {
    createLicense: async (providerParty, request) => {
      // Validate duration
      if (request.duration < 1 || request.duration > 365) {
        return err(new ValidationError('Duration must be between 1 and 365 days'));
      }

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + request.duration);

      // Note: We'll need to import the actual License template when DAML types are generated
      // For now, we'll use a placeholder approach
      // This will be updated once we run the DAML codegen
      try {
        // const createResult = await ledgerClient.create(LicenseTemplate, {
        //   provider: providerParty,
        //   user: request.userId,
        //   productId: request.productId,
        //   expiresAt: expiresAt.toISOString(),
        //   metadata: request.metadata ?? {},
        // });

        // if (!createResult.ok) {
        //   return err(createResult.error);
        // }

        // // Query back from PQS (may need to wait for indexing)
        // await new Promise((resolve) => setTimeout(resolve, 1000));

        // const fetchResult = await repository.findById(createResult.value as unknown as string);

        // if (!fetchResult.ok) {
        //   return err(fetchResult.error);
        // }

        // if (!fetchResult.value) {
        //   return err(
        //     new DomainError('License created but not found in PQS', 'INDEXING_DELAY', 500)
        //   );
        // }

        // return ok(fetchResult.value);

        // Temporary implementation until DAML types are available
        return err(
          new DomainError('License creation not yet implemented - DAML types needed', 'NOT_IMPLEMENTED', 501)
        );
      } catch (error) {
        return err(new DomainError('Failed to create license', 'CREATE_ERROR', 500, error));
      }
    },

    renewLicense: async (request) => {
      // Fetch existing license
      const licenseResult = await repository.findById(request.licenseId);

      if (!licenseResult.ok) {
        return err(licenseResult.error);
      }

      if (!licenseResult.value) {
        return err(new NotFoundError('License', request.licenseId));
      }

      // Note: Exercise Renew choice - will be implemented once DAML types are available
      // const renewResult = await ledgerClient.exercise(
      //   LicenseTemplate.Renew,
      //   request.licenseId as any,
      //   { additionalDays: request.additionalDuration }
      // );

      // Temporary implementation
      return err(
        new DomainError('License renewal not yet implemented - DAML types needed', 'NOT_IMPLEMENTED', 501)
      );
    },

    getLicense: async (contractId) => {
      const result = await repository.findById(contractId);

      if (!result.ok) {
        return err(result.error);
      }

      if (!result.value) {
        return err(new NotFoundError('License', contractId));
      }

      return ok(result.value);
    },

    getUserLicenses: async (userId) => {
      return repository.findActiveByUser(userId);
    },
  };
};
