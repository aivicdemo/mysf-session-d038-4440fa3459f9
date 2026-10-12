import { judgeInvoiceStatusConsistency, InvoiceNotFound } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
}));

describe('SCEN-275: InvoiceNotFound error when invoice does not exist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceNotFound error when no invoice is associated with the deal', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-07T10:00:00.000Z');

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId,
      dealStatus: 'closed',
      customerId: 'cust-001',
      salesRepresentativeId: 'sr-001',
      dealName: 'Test Deal',
      dealAmount: 100000,
      stageId: 'stage-001',
      expectedContractDate: '2026-10-05',
      contractedDate: '2026-10-05',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
      createdBy: 'user-001',
    });

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems.mockResolvedValue(null);

    await expect(
      judgeInvoiceStatusConsistency({ dealId, executedAt })
    ).rejects.toThrow(InvoiceNotFound);

    expect(mockFetchDealById).toHaveBeenCalledWith({ dealId });
    expect(mockFetchInvoiceWithLineItems).toHaveBeenCalledWith({ invoiceId: dealId });
  });
});
