import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1565: 抽出スコープ確定後、対象期間内の請求書が請求ステータス・金額・参照関係とともに抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract invoices with billing status, amount, and reference relationships within the target period', async () => {
    const closingInstructionId = 'CI-20250101-001';
    const targetMonth = '2025-01';
    const operatorUserId = 'USR-SALES-OP-001';
    const executionTimestamp = new Date('2025-01-05T09:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: '顧客A', isActive: true, customerType: '通常' },
        { customerId: 'CUST-002', customerName: '顧客B', isActive: true, customerType: '通常' },
      ],
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: '取引A',
          customerId: 'CUST-001',
          dealStatus: '成約済み',
          dealAmount: 1000000,
          invoicingDate: '2025-01-15',
          closingDate: '2025-01-10',
        },
        {
          dealId: 'DEAL-002',
          dealName: '取引B',
          customerId: 'CUST-002',
          dealStatus: '成約済み',
          dealAmount: 500000,
          invoicingDate: '2025-01-20',
          closingDate: '2025-01-18',
        },
      ],
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-20250115-001',
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          invoiceAmount: 1000000,
          invoiceStatus: '未払い',
          invoiceDate: '2025-01-15',
          invoiceLineItems: [
            {
              lineItemId: 'LI-001',
              productName: '商品A',
              unitPrice: 500000,
              quantity: 2,
              totalPrice: 1000000,
            },
          ],
        },
        {
          invoiceId: 'INV-20250120-002',
          dealId: 'DEAL-002',
          customerId: 'CUST-002',
          invoiceAmount: 500000,
          invoiceStatus: '未払い',
          invoiceDate: '2025-01-20',
          invoiceLineItems: [
            {
              lineItemId: 'LI-002',
              productName: '商品B',
              unitPrice: 500000,
              quantity: 1,
              totalPrice: 500000,
            },
          ],
        },
      ],
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触', sequenceOrder: 1, isActive: true },
        { stageId: 'STAGE-005', stageName: '成約済み', sequenceOrder: 5, isActive: true },
      ],
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          ruleId: 'VR-001',
          ruleName: '取引先と請求書の紐付け確認',
          ruleType: 'referentialIntegrity',
          targetObjects: ['取引先', '請求書'],
          validationLogic: 'invoiceCustomerId == dealCustomerId',
        },
        {
          ruleId: 'VR-002',
          ruleName: '商談と請求書の金額一致確認',
          ruleType: 'amountMatching',
          targetObjects: ['商談', '請求書'],
          validationLogic: 'invoiceAmount == dealAmount',
        },
      ],
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.targetMonth).toBe('2025-01');
    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31'));

    expect(result.extractionScope.customerIds).toContain('CUST-001');
    expect(result.extractionScope.customerIds).toContain('CUST-002');
    expect(result.extractionScope.totalCustomerCount).toBe(2);

    expect(result.extractionScope.dealIds).toContain('DEAL-001');
    expect(result.extractionScope.dealIds).toContain('DEAL-002');
    expect(result.extractionScope.totalDealCount).toBe(2);

    expect(result.extractionScope.invoiceIds).toContain('INV-20250115-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-20250120-002');
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    expect(result.extractionScope.extractionObjects).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.any(String),
        description: expect.stringContaining('紐付け'),
      }),
    );

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();
    expect(result.preparationCompletedAt.getTime()).toBeGreaterThanOrEqual(executionTimestamp.getTime());
  });
});
