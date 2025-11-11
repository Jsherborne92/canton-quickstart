import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLicenseService } from '../../../src/domain/licensing/service.js';
import type { LedgerClient } from '../../../src/ledger/client.js';
import type { LicenseRepository } from '../../../src/domain/licensing/repository.js';

describe('LicenseService', () => {
  let mockLedgerClient: LedgerClient;
  let mockRepository: LicenseRepository;
  let service: ReturnType<typeof createLicenseService>;

  beforeEach(() => {
    mockLedgerClient = {
      create: vi.fn(),
      exercise: vi.fn(),
      query: vi.fn(),
      fetch: vi.fn(),
    };

    mockRepository = {
      findById: vi.fn(),
      findByQuery: vi.fn(),
      findActiveByUser: vi.fn(),
    };

    service = createLicenseService(mockLedgerClient, mockRepository);
  });

  it('should reject invalid duration below minimum', async () => {
    const result = await service.createLicense('provider-party', {
      userId: 'user-party',
      productId: 'product-1',
      duration: 0, // Invalid
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject invalid duration above maximum', async () => {
    const result = await service.createLicense('provider-party', {
      userId: 'user-party',
      productId: 'product-1',
      duration: 400, // Invalid
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should return not found error when license does not exist', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValue({
      ok: true,
      value: null,
    });

    const result = await service.getLicense('non-existent-id');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('should get user licenses successfully', async () => {
    const mockLicenses = [
      {
        contractId: 'contract-1',
        provider: 'provider-party',
        user: 'user-party',
        productId: 'product-1',
        expiresAt: new Date(),
        createdAt: new Date(),
        status: 'active' as const,
      },
    ];

    vi.mocked(mockRepository.findActiveByUser).mockResolvedValue({
      ok: true,
      value: mockLicenses,
    });

    const result = await service.getUserLicenses('user-party');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.productId).toBe('product-1');
    }
  });
});
