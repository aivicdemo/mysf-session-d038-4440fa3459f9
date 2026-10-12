import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-787: Multiple filters condition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only deals matching all filter conditions', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: 'Case A',
        dealAmount: 1000000,
        stageId: 'stage-001',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: 'Test case A',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-15T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-15T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-002',
        dealName: 'Case B',
        dealAmount: 2000000,
        stageId: 'stage-002',
        expectedContractDate: '2024-11-30T23:59:59Z',
        description: 'Test case B',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-20T09:00:00Z',
        updatedAt: '2024-02-20T11:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-03-20T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-B',
        salesRepresentativeId: 'rep-001',
        dealName: 'Case C',
        dealAmount: 1500000,
        stageId: 'stage-001',
        expectedContractDate: '2024-10-15T23:59:59Z',
        description: 'Test case C',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-25T13:00:00Z',
        updatedAt: '2024-02-18T16:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-18T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-B',
        salesRepresentativeId: 'rep-002',
        dealName: 'Case D',
        dealAmount: 3000000,
        stageId: 'stage-002',
        expectedContractDate: '2024-09-30T23:59:59Z',
        description: 'Test case D',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-02-01T08:30:00Z',
        updatedAt: '2024-02-22T09:15:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2024-03-22T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-005',
        dealId: 'deal-005',
        customerId: 'customer-C',
        salesRepresentativeId: 'rep-001',
        dealName: 'Case E',
        dealAmount: 500000,
        stageId: 'stage-003',
        expectedContractDate: '2024-08-20T23:59:59Z',
        description: 'Test case E',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T11:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-03-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue(mockDeals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-02-01T00:00:00Z',
      periodEndDateTime: '2024-02-28T23:59:59Z',
      salesRepresentativeIdFilter: 'rep-001',
      customerIdFilter: 'customer-A',
      stageIdFilter: 'stage-001',
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(1);
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001',
      customerId: 'customer-A',
      salesRepresentativeId: 'rep-001',
      dealName: 'Case A',
      dealAmount: 1000000,
      stageId: 'stage-001',
      updatedAt: '2024-02-15T14:30:00Z',
    });
    expect(result.totalCount).toBe(1);
  });
});
