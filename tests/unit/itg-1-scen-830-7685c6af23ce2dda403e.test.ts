import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchDealById } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store.ts')>('../../src/platform/data-store.ts'),
  listRecords: jest.fn() as unknown as (tableName: string) => Promise<any[]>,
}));

describe('SCEN-830: fetchDealById normal case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return FetchDealByIdOutput with all fields correctly', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      dealName: 'A社システム導入案件',
      dealAmount: 5000000,
      stageId: 'negotiation',
      expectedContractDate: '2026-12-31T23:59:59Z',
      contractedDate: null,
      description: 'クラウドシステム導入。初期設定とトレーニング含む。',
      lossReason: null,
      invoiceGenerationSLADeadline: '2027-01-15T23:59:59Z',
      invoiceSLAExceededFlag: false,
      createdAt: '2026-10-01T10:30:00Z',
      updatedAt: '2026-10-07T14:45:00Z',
      createdBy: '880e8400-e29b-41d4-a716-446655440003'
    };

    const mockDataStore = require('../../src/platform/data-store.ts') as any;
    mockDataStore.listRecords.mockResolvedValueOnce([mockRecord]);

    const result = await fetchDealById({ dealId });

    expect(result).toEqual({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      dealName: 'A社システム導入案件',
      dealAmount: 5000000,
      stageId: 'negotiation',
      expectedContractDate: '2026-12-31T23:59:59Z',
      contractedDate: null,
      description: 'クラウドシステム導入。初期設定とトレーニング含む。',
      lossReason: null,
      invoiceGenerationSLADeadline: '2027-01-15T23:59:59Z',
      invoiceSLAExceededFlag: false,
      createdAt: '2026-10-01T10:30:00Z',
      updatedAt: '2026-10-07T14:45:00Z',
      createdBy: '880e8400-e29b-41d4-a716-446655440003'
    });
  });
});
