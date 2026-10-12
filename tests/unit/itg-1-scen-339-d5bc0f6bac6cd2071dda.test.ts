import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-339: 複数の請求書の中に滞納状態の請求書がある場合、invoiceDetails の isOverdue に true が設定される', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof import('../../src/logic/data-persistence')>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('滞納状態の請求書が存在する場合、isOverdue が true に設定される', async () => {
    const dealId = 'DEAL-2024-001';
    const currentDateTime = new Date('2024-12-20T00:00:00Z');

    // 商談基本情報のモック
    mockDataPersistence.fetchDealById.mockResolvedValue({
      dealId: 'DEAL-2024-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Deal 1',
      dealAmount: 1000000,
      stageId: 'stage-won',
      expectedContractDate: '2024-11-01',
      contractedDate: '2024-11-01',
      description: 'Closed Won Deal',
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-11-01T00:00:00Z',
      updatedAt: '2024-11-01T00:00:00Z',
      createdBy: 'system',
    });

    // 請求書一覧のモック
    mockDataPersistence.fetchInvoicesForPeriod.mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-2024-001',
          dealId: 'DEAL-2024-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-11-01',
          dueDate: '2024-12-01',
          invoiceAmount: 550000,
          taxAmount: 50000,
          untaxedAmount: 500000,
          invoiceStatus: 'issued',
          paidDate: '2024-11-15',
          paidAmount: 500000,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-11-01T00:00:00Z',
          updatedAt: '2024-11-01T00:00:00Z',
          createdBy: 'system',
        },
        {
          invoiceId: 'INV-2024-002',
          dealId: 'DEAL-2024-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          invoiceNumber: 'INV-002',
          invoiceDate: '2024-11-01',
          dueDate: '2024-12-10',
          invoiceAmount: 550000,
          taxAmount: 50000,
          untaxedAmount: 500000,
          invoiceStatus: 'issued',
          paidDate: null,
          paidAmount: 0,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: 'verified',
          referenceIntegrityVerificationStatus: 'verified',
          createdAt: '2024-11-01T00:00:00Z',
          updatedAt: '2024-11-01T00:00:00Z',
          createdBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // 請求明細一覧のモック
    mockDataPersistence.fetchInvoiceLineItemsByInvoice.mockResolvedValue({
      lineItems: [
        {
          lineItemId: 'LI-001',
          invoiceId: 'INV-2024-001',
          dealId: 'DEAL-2024-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product 1',
          productDescription: null,
          quantity: 1,
          unitPrice: 500000,
          amount: 500000,
          taxRate: 10,
          taxAmount: 50000,
          taxIncludedAmount: 550000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2024-11-01T00:00:00Z',
          updatedAt: '2024-11-01T00:00:00Z',
          createdBy: 'system',
        },
        {
          lineItemId: 'LI-002',
          invoiceId: 'INV-2024-002',
          dealId: 'DEAL-2024-001',
          activityId: null,
          lineNumber: 1,
          productName: 'Product 1',
          productDescription: null,
          quantity: 1,
          unitPrice: 500000,
          amount: 500000,
          taxRate: 10,
          taxAmount: 50000,
          taxIncludedAmount: 550000,
          remarks: null,
          modificationPreviousQuantity: null,
          modificationPreviousUnitPrice: null,
          modificationPreviousAmount: null,
          createdAt: '2024-11-01T00:00:00Z',
          updatedAt: '2024-11-01T00:00:00Z',
          createdBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    // 検証ルールのモック（滞納判定基準日数：0日）
    mockDataPersistence.fetchAllValidationRules.mockResolvedValue({
      validationRules: [
        {
          validationRuleId: 'VR-001',
          ruleName: 'overdue_days_threshold',
          ruleDescription: 'Days threshold for overdue judgment',
          targetTable: 'invoices',
          targetColumn: 'dueDate',
          validationType: 'overdue_threshold',
          validationCondition: '0',
          errorMessage: 'Invoice is overdue',
          warningLevel: 'high',
          validFlag: true,
          applicationStartDate: '2024-01-01',
          applicationEndDate: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    // 期待結果の検証
    expect(result.dealId).toBe('DEAL-2024-001');
    expect(result.invoiceCount).toBe(2);
    expect(result.invoiceDetails).toHaveLength(2);

    // INV-2024-001 の検証（支払期限2024-12-01、現在日時2024-12-20、支払済）
    const inv1 = result.invoiceDetails.find((d) => d.invoiceId === 'INV-2024-001');
    expect(inv1).toBeDefined();
    expect(inv1?.isOverdue).toBe(false);
    expect(inv1?.paidAmount).toBe(500000);

    // INV-2024-002 の検証（支払期限2024-12-10、現在日時2024-12-20、未入金）
    const inv2 = result.invoiceDetails.find((d) => d.invoiceId === 'INV-2024-002');
    expect(inv2).toBeDefined();
    expect(inv2?.isOverdue).toBe(true);
    expect(inv2?.paidAmount).toBe(0);

    // 全体の請求ステータスが overdue であることを確認
    expect(result.invoiceStatus).toBe('overdue');
  });
});
