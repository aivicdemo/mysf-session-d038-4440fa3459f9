import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-793: fetchDealsForPeriod returns deals with all SaveDealOutput attributes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals array where each record contains all SaveDealOutput attributes including null values', async () => {
    const testDeals = [
      {
        id: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社保守契約更新',
        dealAmount: 1200000,
        stageId: '成約',
        expectedContractDate: '2024-07-15T00:00:00Z',
        description: 'B社保守契約1年更新',
        contractedDate: '2024-07-10T00:00:00Z',
        lossReason: null,
        createdAt: '2024-06-01T09:00:00Z',
        updatedAt: '2024-06-25T16:20:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-07-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社追加モジュール',
        dealAmount: 800000,
        stageId: '初期接触',
        expectedContractDate: '2024-09-30T00:00:00Z',
        description: '初期接触段階',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-06-10T11:15:00Z',
        updatedAt: '2024-06-22T13:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-09-30T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入',
        dealAmount: 5000000,
        stageId: '提案中',
        expectedContractDate: '2024-12-31T00:00:00Z',
        description: 'A社向けシステム導入プロジェクト',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-06-20T14:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-12-31T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(testDeals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-06-01T00:00:00Z',
      periodEndDateTime: '2024-06-30T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // Verify all deals have all SaveDealOutput attributes
    result.deals.forEach(deal => {
      expect(deal).toHaveProperty('dealId');
      expect(deal).toHaveProperty('customerId');
      expect(deal).toHaveProperty('salesRepresentativeId');
      expect(deal).toHaveProperty('dealName');
      expect(deal).toHaveProperty('dealAmount');
      expect(deal).toHaveProperty('stageId');
      expect(deal).toHaveProperty('expectedContractDate');
      expect(deal).toHaveProperty('description');
      expect(deal).toHaveProperty('contractedDate');
      expect(deal).toHaveProperty('lossReason');
      expect(deal).toHaveProperty('createdAt');
      expect(deal).toHaveProperty('updatedAt');
      expect(deal).toHaveProperty('createdBy');
      expect(deal).toHaveProperty('invoiceGenerationSLADeadline');
      expect(deal).toHaveProperty('invoiceSLAExceededFlag');
    });

    // Verify null attributes are present and remain null
    const dealWith001 = result.deals.find(d => d.dealId === 'deal-001');
    expect(dealWith001?.contractedDate).toBeNull();
    expect(dealWith001?.lossReason).toBeNull();

    const dealWith003 = result.deals.find(d => d.dealId === 'deal-003');
    expect(dealWith003?.contractedDate).toBeNull();
    expect(dealWith003?.lossReason).toBeNull();

    expect(result.fetchedAt).toBeDefined();
  });
});
