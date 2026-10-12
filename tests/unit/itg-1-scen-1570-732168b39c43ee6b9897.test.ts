import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1570: 商談と請求ステータスに不整合があれば不整合が検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect inconsistencies between deal status and invoice status', async () => {
    const closingInstructionId = 'INSTR-2024-12-001';
    const targetMonth = '2024-12';
    const operatorUserId = 'USR-SALES-ADMIN-001';
    const executionTimestamp = new Date('2024-12-15T10:30:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'CUST-001', customerName: '取引先A', isActive: true },
        { customerId: 'CUST-002', customerName: '取引先B', isActive: true },
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
          invoiceDate: '2024-12-10',
          amount: 1000000,
        },
        {
          dealId: 'DEAL-002',
          dealName: '案件B',
          status: '成約済み',
          invoiceDate: '2024-12-15',
          amount: 500000,
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod - DEAL-002 has no corresponding invoice, DEAL-003 invoice exists without deal
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'DEAL-001',
          invoiceDate: '2024-12-10',
          amount: 1000000,
          status: '請求済み',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'DEAL-003',
          invoiceDate: '2024-12-16',
          amount: 300000,
          status: '請求済み',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
        { stageId: 'STAGE-002', stageName: '失注', isActive: true },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          ruleId: 'RULE-001',
          ruleName: '商談と請求の紐付け確認',
          description: '商談IDと請求書のdealIdが一致することを確認',
        },
        {
          ruleId: 'RULE-002',
          ruleName: '金額一致確認',
          description: '商談金額と請求金額が一致することを確認',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    const result = await prepareMonthlyClosing({
      closingInstructionId,
      targetMonth,
      operatorUserId,
      executionTimestamp,
    });

    // When inconsistencies are detected, readyForExtraction should be false
    expect(result.readyForExtraction).toBe(false);

    // Verify extraction criteria includes data integrity checks
    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.any(String),
        description: expect.stringContaining('紐付け'),
      }),
    );

    expect(result.preparationCompletedAt).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(executionTimestamp);
  });
});
