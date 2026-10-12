import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, DealAmountInvalid, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1633: 商談確定金額が0以下の場合エラーが発生', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談テーブルに負の金額を持つレコードがある場合、エラーが発生する', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'テスト商談A',
        dealAmount: -50000,
        stageId: '提案',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: 'テスト用',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-11-01T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-10-01T10:00:00Z',
        updatedAt: '2024-10-15T14:30:00Z',
        createdBy: 'user-001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2024-10-01T00:00:00Z',
      periodEndDateTime: '2024-10-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(DealAmountInvalid);
  });
});
