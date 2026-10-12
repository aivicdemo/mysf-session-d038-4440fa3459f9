import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-328: 商談が存在し複数の請求書で分割請求されており全額入金済みの場合、請求ステータスが「入金済」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の請求書で分割請求されており全額入金済みの場合、invoiceStatus が paid と判定される', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-20250107-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount: 1000000,
      stageId: 'stage-closed',
      expectedContractDate: '2025-01-10',
      contractedDate: '2025-01-10',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-10T00:00:00Z',
      createdBy: 'user-001',
    };

    const mockInvoices = {
      invoices: [
        {
          invoiceId: 'INV-2025-001',
          dealId: 'DEAL-20250107-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-2025-001',
          invoiceDate: '2025-01-05',
          dueDate: '2025-02-04',
          invoiceAmount: 500000,
          taxAmount: 50000,
          untaxedAmount: 450000,
          invoiceStatus: 'paid',
          paidDate: '2025-01-12',
          paidAmount: 500000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2025-01-05T00:00:00Z',
          updatedAt: '2025-01-12T00:00:00Z',
          createdBy: 'user-001',
        },
        {
          invoiceId: 'INV-2025-002',
          dealId: 'DEAL-20250107-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-2025-002',
          invoiceDate: '2025-01-07',
          dueDate: '2025-02-06',
          invoiceAmount: 500000,
          taxAmount: 50000,
          untaxedAmount: 450000,
          invoiceStatus: 'paid',
          paidDate: '2025-01-14',
          paidAmount: 500000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2025-01-07T00:00:00Z',
          updatedAt: '2025-01-14T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2025-01-15T10:00:00Z',
    };

    const mockLineItems1 = {
      lineItems: [
        {
          lineItemId: 'LI-001',
          invoiceId: 'INV-2025-001',
          dealId: 'DEAL-20250107-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product A',
          productDescription: null,
          quantity: 1,
          unitPrice: 500000,
          amount: 500000,
          taxRate: 0.1,
          taxAmount: 50000,
          taxIncludedAmount: 550000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2025-01-05T00:00:00Z',
          updatedAt: '2025-01-05T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-05T00:00:00Z',
    };

    const mockLineItems2 = {
      lineItems: [
        {
          lineItemId: 'LI-002',
          invoiceId: 'INV-2025-002',
          dealId: 'DEAL-20250107-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product B',
          productDescription: null,
          quantity: 1,
          unitPrice: 500000,
          amount: 500000,
          taxRate: 0.1,
          taxAmount: 50000,
          taxIncludedAmount: 550000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2025-01-07T00:00:00Z',
          updatedAt: '2025-01-07T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-07T00:00:00Z',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValueOnce(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems1);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems2);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValueOnce({
      validationRules: [{ validationRuleId: 'rule-1', ruleName: 'Overdue Check', validationCondition: '0' }],
      totalCount: 1,
      fetchedAt: '2025-01-15T10:00:00Z',
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20250107-001');
    expect(result.invoiceStatus).toBe('paid');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(1000000);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(2);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-2025-001',
      invoiceAmount: 500000,
      paidAmount: 500000,
      invoiceStatus: 'paid',
      dueDate: new Date('2025-02-04'),
      isOverdue: false,
    });
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-2025-002',
      invoiceAmount: 500000,
      paidAmount: 500000,
      invoiceStatus: 'paid',
      dueDate: new Date('2025-02-06'),
      isOverdue: false,
    });
  });
});
