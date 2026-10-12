import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-364: 請求書が存在し支払期限を超過し未入金残額がある場合、請求ステータスが「滞納」と判定される', () => {
  it('invoiceStatus="overdue" が返される', async () => {
    const mockFetchDealById = dataPersistence.fetchDealById as jest.MockedFunction<typeof dataPersistence.fetchDealById>;
    const mockFetchInvoicesForPeriod = dataPersistence.fetchInvoicesForPeriod as jest.MockedFunction<typeof dataPersistence.fetchInvoicesForPeriod>;
    const mockFetchInvoiceLineItemsByInvoice = dataPersistence.fetchInvoiceLineItemsByInvoice as jest.MockedFunction<typeof dataPersistence.fetchInvoiceLineItemsByInvoice>;
    const mockFetchAllValidationRules = dataPersistence.fetchAllValidationRules as jest.MockedFunction<typeof dataPersistence.fetchAllValidationRules>;

    // 対象商談の基本情報
    mockFetchDealById.mockResolvedValue({
      dealId: 'DEAL-001',
      dealAmount: 1000000,
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      stageId: 'stage-closed',
      expectedContractDate: '2025-12-01',
      contractedDate: '2025-12-01',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2025-12-01',
      updatedAt: '2025-12-01',
      createdBy: 'user-001',
    });

    // 商談に紐付く請求書一覧
    mockFetchInvoicesForPeriod.mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2025-12-10',
          dueDate: '2026-01-10',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          untaxedAmount: 900000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: 0,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2025-12-10',
          updatedAt: '2025-12-10',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-01-15T10:00:00Z',
    });

    // 請求書に紐付く請求明細一覧
    mockFetchInvoiceLineItemsByInvoice.mockResolvedValue({
      lineItems: [
        {
          lineItemId: 'LINE-001',
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product A',
          productDescription: null,
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          taxRate: 10,
          taxAmount: 100000,
          taxIncludedAmount: 1100000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2025-12-10',
          updatedAt: '2025-12-10',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-01-15T10:00:00Z',
    });

    // 滞納判定の基準日数
    mockFetchAllValidationRules.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'RULE-001',
          ruleName: 'overdue_threshold',
          ruleDescription: '滞納判定の基準日数',
          targetTable: 'invoices',
          targetColumn: 'dueDate',
          validationType: 'numeric',
          validationCondition: '0',
          errorMessage: 'Overdue threshold validation failed',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2025-01-01',
          applicationEndDate: null,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-01-15T10:00:00Z',
    });

    const input = {
      dealId: 'DEAL-001',
      currentDateTime: new Date('2026-01-15T10:00:00Z'),
    };

    const result = await classifyInvoiceStatus(input);

    expect(result.dealId).toBe('DEAL-001');
    expect(result.invoiceStatus).toBe('overdue');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.invoiceDetails).toEqual([
      {
        invoiceId: 'INV-001',
        invoiceAmount: 1000000,
        paidAmount: 0,
        invoiceStatus: 'issued',
        dueDate: new Date('2026-01-10'),
        isOverdue: true,
      },
    ]);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
  });
});
