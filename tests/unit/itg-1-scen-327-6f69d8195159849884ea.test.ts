import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-327: 商談が存在し一部の請求書のみ入金がある場合、請求ステータスが「部分請求」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('一部の請求書のみ入金がある場合、invoiceStatus が partial_billing と判定される', async () => {
    const dealId = 'DEAL-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount: 100000,
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
          invoiceDate: '2026-09-15',
          dueDate: '2026-10-10',
          invoiceAmount: 50000,
          taxAmount: 5000,
          untaxedAmount: 45000,
          invoiceStatus: 'issued',
          paidDate: '2026-10-05',
          paidAmount: 50000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2026-09-15T00:00:00Z',
          updatedAt: '2026-10-05T00:00:00Z',
          createdBy: 'user-001',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-002',
          invoiceDate: '2026-09-20',
          dueDate: '2026-11-10',
          invoiceAmount: 50000,
          taxAmount: 5000,
          untaxedAmount: 45000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: 0,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2026-09-20T00:00:00Z',
          updatedAt: '2026-09-20T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2026-10-15T10:00:00Z',
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
          unitPrice: 50000,
          amount: 50000,
          taxRate: 0.1,
          taxAmount: 5000,
          taxIncludedAmount: 55000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2026-09-15T00:00:00Z',
          updatedAt: '2026-09-15T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-09-15T00:00:00Z',
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
          unitPrice: 50000,
          amount: 50000,
          taxRate: 0.1,
          taxAmount: 5000,
          taxIncludedAmount: 55000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2026-09-20T00:00:00Z',
          updatedAt: '2026-09-20T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-09-20T00:00:00Z',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValueOnce(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems1);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems2);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValueOnce({
      validationRules: [{ validationRuleId: 'rule-1', ruleName: 'Overdue Check', validationCondition: '0' }],
      totalCount: 1,
      fetchedAt: '2026-10-15T10:00:00Z',
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceStatus).toBe('partial_billing');
    expect(result.dealId).toBe('DEAL-001');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(100000);
    expect(result.totalPaidAmount).toBe(50000);
    expect(result.dealAmount).toBe(100000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(2);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-001',
      invoiceAmount: 50000,
      paidAmount: 50000,
      invoiceStatus: 'issued',
      dueDate: new Date('2026-10-10'),
      isOverdue: false,
    });
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-002',
      invoiceAmount: 50000,
      paidAmount: 0,
      invoiceStatus: 'issued',
      dueDate: new Date('2026-11-10'),
      isOverdue: false,
    });
  });
});
