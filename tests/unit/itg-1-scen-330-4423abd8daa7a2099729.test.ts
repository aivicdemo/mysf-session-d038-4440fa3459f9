import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-330: 支払期限内で未入金残額がある場合、請求ステータスが「請求済」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('支払期限内で未入金残額がある場合、invoiceStatus が billed と判定される', async () => {
    const dealId = 'DEAL-20240115-001';
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-20240115-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount: 1000000,
      stageId: 'stage-closed',
      expectedContractDate: '2024-01-10',
      contractedDate: '2024-01-10',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
      createdBy: 'user-001',
    };

    const mockInvoices = {
      invoices: [
        {
          invoiceId: 'INV-2024-0001',
          dealId: 'DEAL-20240115-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-2024-0001',
          invoiceDate: '2024-01-11',
          dueDate: '2024-02-10',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          untaxedAmount: 900000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: 500000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-11T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    };

    const mockLineItems = {
      lineItems: [
        {
          lineItemId: 'LI-001',
          invoiceId: 'INV-2024-0001',
          dealId: 'DEAL-20240115-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product',
          productDescription: null,
          quantity: 1,
          unitPrice: 900000,
          amount: 1000000,
          taxRate: 0.1,
          taxAmount: 100000,
          taxIncludedAmount: 1100000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2024-01-11T00:00:00Z',
          updatedAt: '2024-01-11T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-11T00:00:00Z',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValueOnce(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValueOnce(mockLineItems);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValueOnce({
      validationRules: [{ validationRuleId: 'rule-1', ruleName: 'Overdue Check', validationCondition: '0' }],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20240115-001');
    expect(result.invoiceStatus).toBe('billed');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(500000);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(1);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-2024-0001',
      invoiceAmount: 1000000,
      paidAmount: 500000,
      invoiceStatus: 'issued',
      dueDate: new Date('2024-02-10'),
      isOverdue: false,
    });
  });
});
