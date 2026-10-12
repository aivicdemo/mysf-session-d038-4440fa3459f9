import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1569: 商談ステータスと請求ステータスの整合性が自動検証される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should automatically validate consistency between deal status and invoice status', async () => {
    const closingInstructionId = 'INSTR-2024-12-001';
    const targetMonth = '2024-12';
    const operatorUserId = 'USR-SALES-OPS-001';
    const executionTimestamp = new Date('2024-12-05T10:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: 'A株式会社', isTestCustomer: false },
        { customerId: 'CUST-002', customerName: 'B株式会社', isTestCustomer: false },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          dealName: '案件A',
          status: '成約済み',
          amount: 1000000,
          customerId: 'CUST-001',
          closeDateInPeriod: '2024-12-10',
        },
        {
          dealId: 'DEAL-002',
          dealName: '案件B',
          status: '成約済み',
          amount: 500000,
          customerId: 'CUST-002',
          closeDateInPeriod: '2024-12-15',
        },
        {
          dealId: 'DEAL-003',
          dealName: '案件C',
          status: 'キャンセル',
          amount: 300000,
          customerId: 'CUST-001',
          closeDateInPeriod: null,
        },
      ],
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-2024-12-001',
          dealId: 'DEAL-001',
          invoiceDate: '2024-12-10',
          amount: 1000000,
          status: '請求済み',
        },
        {
          invoiceId: 'INV-2024-12-002',
          dealId: 'DEAL-002',
          invoiceDate: '2024-12-15',
          amount: 500000,
          status: '請求済み',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触', sequence: 1 },
        { stageId: 'STAGE-002', stageName: '提案中', sequence: 2 },
        { stageId: 'STAGE-003', stageName: '成約済み', sequence: 3 },
        { stageId: 'STAGE-004', stageName: 'キャンセル', sequence: 4 },
      ],
      totalCount: 4,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          ruleId: 'RULE-001',
          ruleName: '商談と請求の紐付け確認',
          description: '成約済み商談に対応する請求書が存在することを確認',
          validationType: 'dealInvoiceMapping',
        },
        {
          ruleId: 'RULE-002',
          ruleName: '金額一致確認',
          description: '商談金額と請求金額が一致することを確認',
          validationType: 'amountMatching',
        },
        {
          ruleId: 'RULE-003',
          ruleName: 'ステータス整合性確認',
          description: '商談ステータスと請求ステータスが整合していることを確認',
          validationType: 'statusConsistency',
        },
      ],
      totalCount: 3,
      fetchedAt: new Date().toISOString(),
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2024-12-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2024-12-31'));

    // Verify extraction scope contains customers, deals, and invoices
    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBeGreaterThanOrEqual(2);
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    // Verify that cancelled deals are excluded
    expect(result.extractionScope.exclusionRules).toContainEqual(
      expect.stringContaining('キャンセル'),
    );

    // Verify data integrity checkpoints include deal-invoice mapping and status consistency
    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.any(String),
        description: expect.stringContaining('紐付け'),
      }),
    );

    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.any(String),
        description: expect.stringContaining('ステータス'),
      }),
    );

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();
  });
});
