import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, InvalidDealStage, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1632: ステージ値が定義済み値以外の場合エラーが発生', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談テーブルに無効なステージ値を持つレコードがある場合、エラーが発生する', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社 システム導入',
        dealAmount: 5000000,
        stageId: '提案中',
        expectedContractDate: '2024-02-28T23:59:59Z',
        description: 'A社向けシステム導入提案',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-03-10T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社 保守契約更新',
        dealAmount: 1200000,
        stageId: '無効値',
        expectedContractDate: '2024-03-15T23:59:59Z',
        description: 'B社保守契約の更新',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-04-05T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-25T16:45:00Z',
        createdBy: 'user-002',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-02-01T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow(InvalidDealStage);
  });
});
