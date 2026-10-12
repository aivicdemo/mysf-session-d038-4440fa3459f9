import { judgeInvoiceStatusConsistency, DealNotClosed } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
}));

describe('SCEN-274: DealNotClosed error when deal status is not closed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealNotClosed error when deal status is not closed', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-15T10:30:00Z');

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId,
      dealStatus: '保留',
      customerId: 'cust-001',
      salesRepresentativeId: 'sr-001',
      dealName: 'Test Deal',
      dealAmount: 100000,
      stageId: 'stage-001',
      expectedContractDate: '2026-10-20',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
      createdBy: 'user-001',
    });

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems.mockResolvedValue({
      invoice: {
        invoiceId: 'inv-001',
        invoiceStatus: '未請求',
        invoiceAmount: 100000,
        invoiceDate: '2026-10-10T00:00:00Z',
        dealId,
        customerId: 'cust-001',
        salesRepresentativeId: 'sr-001',
        invoiceNumber: 'INV-001',
        dueDate: '2026-11-10',
        taxAmount: 10000,
        untaxedAmount: 90000,
        paidDate: null,
        paidAmount: null,
        remarks: null,
        modificationReason: null,
        reissueCount: 0,
        lastReissuedAt: null,
        amountCalculationVerificationStatus: 'verified',
        referenceIntegrityVerificationStatus: 'verified',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
        createdBy: 'user-001',
      },
      lineItems: [
        {
          lineItemId: 'li-001',
          invoiceId: 'inv-001',
          dealId,
          activityId: null,
          lineNumber: 1,
          productName: 'Product A',
          productDescription: null,
          quantity: 1,
          unitPrice: 100000,
          amount: 100000,
          taxRate: 0.1,
          taxAmount: 10000,
          taxIncludedAmount: 110000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
    });

    await expect(
      judgeInvoiceStatusConsistency({ dealId, executedAt })
    ).rejects.toThrow(DealNotClosed);

    expect(mockFetchDealById).toHaveBeenCalledWith({ dealId });
  });
});
