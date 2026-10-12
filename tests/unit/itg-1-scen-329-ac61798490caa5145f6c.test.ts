import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-329: 支払期限を超過し未入金残額がある場合、請求ステータスが「滞納」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('支払期限を超過し未入金残額がある場合、invoiceStatus が overdue と判定される', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T00:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-20250107-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount: 1000000,
      stageId: 'stage-closed',
      expectedContractDate: '2024-12-01',
      contractedDate: '2024-12-01',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'user-001',
    };

    const mockInvoices = {
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-20250107-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-12-01',
          dueDate: '2024-12-31',
          invoiceAmount: 500000,
          taxAmount: 50000,
          untaxedAmount: 450000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: 0,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-12-01T00:00:00Z',
          updatedAt: '2024-12-01T00:00:00Z',
          createdBy: 'user-001',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-20250107-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-002',
          invoiceDate: '2024-12-15',
          dueDate: '2025-01-10',
          invoiceAmount: 500000,
          taxAmount: 50000,
          untaxedAmount: 450000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: 0,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-12-15T00:00:00Z',
          updatedAt: '2024-12-15T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2025-01-15T00:00:00Z',
    };

    const mockLineItems1 = {
      lineItems: [
        {
          lineItemId: 'LI-001',
          invoiceId: 'INV-001',
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
          createdAt: '2024-12-01T00:00:00Z',
          updatedAt: '2024-12-01T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-12-01T00:00:00Z',
    };

    const mockLineItems2 = {
      lineItems: [
        {
          lineItemId: 'LI-002',
          invoiceId: 'INV-002',
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
          createdAt: '2024-12-15T00:00:00Z',
          updatedAt: '2024-12-15T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-12-15T00:00:00Z',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValueOnce(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems1);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems2);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValueOnce({
      validationRules: [{ validationRuleId: 'rule-1', ruleName: 'Overdue Check', validationCondition: '0' }],
      totalCount: 1,
      fetchedAt: '2025-01-15T00:00:00Z',
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20250107-001');
    expect(result.invoiceStatus).toBe('overdue');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(2);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-001',
      invoiceAmount: 500000,
      paidAmount: 0,
      invoiceStatus: 'issued',
      dueDate: new Date('2024-12-31'),
      isOverdue: true,
    });
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-002',
      invoiceAmount: 500000,
      paidAmount: 0,
      invoiceStatus: 'issued',
      dueDate: new Date('2025-01-10'),
      isOverdue: true,
    });
  });
});
