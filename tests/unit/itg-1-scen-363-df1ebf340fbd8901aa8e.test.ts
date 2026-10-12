import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-363: 請求書が存在し入金金額が請求金額未満で支払期限前の場合、請求ステータスが「請求済」と判定される', () => {
  it('invoiceStatus="billed" が返される', async () => {
    const mockFetchDealById = dataPersistence.fetchDealById as jest.MockedFunction<typeof dataPersistence.fetchDealById>;
    const mockFetchInvoicesForPeriod = dataPersistence.fetchInvoicesForPeriod as jest.MockedFunction<typeof dataPersistence.fetchInvoicesForPeriod>;
    const mockFetchInvoiceLineItemsByInvoice = dataPersistence.fetchInvoiceLineItemsByInvoice as jest.MockedFunction<typeof dataPersistence.fetchInvoiceLineItemsByInvoice>;
    const mockFetchAllValidationRules = dataPersistence.fetchAllValidationRules as jest.MockedFunction<typeof dataPersistence.fetchAllValidationRules>;

    // 対象商談の基本情報
    mockFetchDealById.mockResolvedValue({
      dealId: 'DEAL-20240115-001',
      dealAmount: 100000,
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      stageId: 'stage-closed',
      expectedContractDate: '2024-01-10',
      contractedDate: '2024-01-10',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-10',
      createdBy: 'user-001',
    });

    // 商談に紐付く請求書一覧
    mockFetchInvoicesForPeriod.mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-20240115-001',
          dealId: 'DEAL-20240115-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          untaxedAmount: 90000,
          invoiceStatus: '送付済み',
          paidDate: '2024-01-18',
          paidAmount: 50000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-18',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    });

    // 請求書に紐付く請求明細一覧
    mockFetchInvoiceLineItemsByInvoice.mockResolvedValue({
      lineItems: [
        {
          lineItemId: 'LINE-001',
          invoiceId: 'INV-20240115-001',
          dealId: 'DEAL-20240115-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product A',
          productDescription: null,
          quantity: 1,
          unitPrice: 100000,
          amount: 100000,
          taxRate: 10,
          taxAmount: 10000,
          taxIncludedAmount: 110000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          createdBy: 'user-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
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
          validationCondition: '1',
          errorMessage: 'Overdue threshold validation failed',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-20T10:00:00Z',
    });

    const input = {
      dealId: 'DEAL-20240115-001',
      currentDateTime: new Date('2024-01-20T10:00:00Z'),
    };

    const result = await classifyInvoiceStatus(input);

    expect(result.dealId).toBe('DEAL-20240115-001');
    expect(result.invoiceStatus).toBe('billed');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(100000);
    expect(result.totalPaidAmount).toBe(50000);
    expect(result.invoiceDetails).toEqual([
      {
        invoiceId: 'INV-20240115-001',
        invoiceAmount: 100000,
        paidAmount: 50000,
        invoiceStatus: '送付済み',
        dueDate: new Date('2024-02-15'),
        isOverdue: false,
      },
    ]);
    expect(result.dealAmount).toBe(100000);
    expect(result.amountConsistency).toBe(true);
  });
});
