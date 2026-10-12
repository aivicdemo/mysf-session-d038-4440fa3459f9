import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-791: fetchedAt timestamp in ISO 8601 format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return fetchedAt in current time ISO 8601 format', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'Case A',
        dealAmount: 1000000,
        stageId: 'stage-01',
        expectedContractDate: '2024-02-15T00:00:00Z',
        description: 'Test transaction',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:22:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-02-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'Case B',
        dealAmount: 2500000,
        stageId: 'stage-02',
        expectedContractDate: '2024-03-10T00:00:00Z',
        description: 'Test transaction 2',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-25T16:45:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-03-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue(mockDeals);

    const beforeCall = new Date();
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });
    const afterCall = new Date();

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    const fetchedAtRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(fetchedAtRegex);

    const fetchedAtDate = new Date(result.fetchedAt);
    expect(fetchedAtDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(fetchedAtDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });
});
