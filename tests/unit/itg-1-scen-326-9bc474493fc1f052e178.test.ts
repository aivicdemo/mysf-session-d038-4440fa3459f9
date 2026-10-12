import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-326: 商談が存在し複数の請求書がすべて入金済みの場合、請求ステータスが「入金済」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の請求書がすべて入金済みの場合、invoiceStatus が paid と判定される', async () => {
    const dealId = 'DEAL-001';
    const currentDateTime = new Date('2026-10-15T00:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount: 1000000,
      stageId: 'stage-closed',
      expectedContractDate: '2026-09-01',
      contractedDate: '2026-09-01',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
      createdBy: 'user-001',
    };

    const mockInvoices = {
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2026-09-05',
          dueDate: '2026-10-15',
          invoiceAmount: 500000,
          taxAmount: 50000,
          untaxedAmount: 450000,
          invoiceStatus: 'paid',
          paidDate: '2026-09-15',
          paidAmount: 500000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2026-09-05T00:00:00Z',
          updatedAt: '2026-09-15T00:00:00Z',
          createdBy: 'user-001',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-002',
          invoiceDate: '2026-09-07',
          dueDate: '2026-10-31',
          invoiceAmount: 500000,
          taxAmount: 50000,
          untaxedAmount: 450000,
          invoiceStatus: 'paid',
          paidDate: '2026-10-01',
          paidAmount: 500000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2026-09-07T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2026-10-15T00:00:00Z',
    };

    const mockLineItems1 = {
      lineItems: [
        {
          lineItemId: 'LI-001',
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product A',
          productDescription: null,
          quantity: 1,
          unitPrice: 450000,
          amount: 500000,
          taxRate: 0.1,
          taxAmount: 50000,
          taxIncludedAmount: 550000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2026-09-05T00:00:00Z',
          updatedAt: '2026-09-05T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-09-05T00:00:00Z',
    };

    const mockLineItems2 = {
      lineItems: [
        {
          lineItemId: 'LI-002',
          invoiceId: 'INV-002',
          dealId: 'DEAL-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product B',
          productDescription: null,
          quantity: 1,
          unitPrice: 450000,
          amount: 500000,
          taxRate: 0.1,
          taxAmount: 50000,
          taxIncludedAmount: 550000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2026-09-07T00:00:00Z',
          updatedAt: '2026-09-07T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-09-07T00:00:00Z',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValueOnce(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems1);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems2);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValueOnce({
      validationRules: [{ validationRuleId: 'rule-1', ruleName: 'Overdue Check', validationCondition: '30' }],
      totalCount: 1,
      fetchedAt: '2026-10-15T00:00:00Z',
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-001');
    expect(result.invoiceStatus).toBe('paid');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(1000000);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(2);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-001',
      invoiceAmount: 500000,
      paidAmount: 500000,
      invoiceStatus: 'paid',
      dueDate: new Date('2026-10-15'),
      isOverdue: false,
    });
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-002',
      invoiceAmount: 500000,
      paidAmount: 500000,
      invoiceStatus: 'paid',
      dueDate: new Date('2026-10-31'),
      isOverdue: false,
    });
  });
});
