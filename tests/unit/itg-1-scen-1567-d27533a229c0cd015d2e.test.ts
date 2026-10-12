import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1567: 商談データと請求書抽出後、商談金額と請求金額が照合される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reconcile deal amounts with invoice amounts', async () => {
    const closingInstructionId = 'CI-2025-01-001';
    const targetMonth = '2025-01';
    const operatorUserId = 'OP-sales-001';
    const executionTimestamp = new Date('2025-02-01T09:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        {
          customerId: 'C-001',
          name: 'ABC商事',
          status: 'active',
          recordType: '正規取引先',
        },
        {
          customerId: 'C-002',
          name: 'XYZ製造',
          status: 'active',
          recordType: '正規取引先',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'D-001',
          customerId: 'C-001',
          amount: 5000000,
          status: '成約済み',
          closedDate: '2025-01-15',
          invoiceDate: '2025-01-20',
        },
        {
          dealId: 'D-002',
          customerId: 'C-002',
          amount: 3000000,
          status: '成約済み',
          closedDate: '2025-01-25',
          invoiceDate: '2025-01-28',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod - amounts match deals
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV-001',
          dealId: 'D-001',
          amount: 5000000,
          invoiceDate: '2025-01-20',
          status: '発行済み',
        },
        {
          invoiceId: 'INV-002',
          dealId: 'D-002',
          amount: 3000000,
          invoiceDate: '2025-01-28',
          status: '発行済み',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        {
          stageId: 'STAGE-001',
          stageName: '成約済み',
          isActive: true,
        },
        {
          stageId: 'STAGE-002',
          stageName: '進行中',
          isActive: true,
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          ruleId: 'RULE-001',
          ruleName: '商談と請求書の金額照合',
          ruleType: '金額整合性',
          isActive: true,
        },
        {
          ruleId: 'RULE-002',
          ruleName: '請求書の発行日が対象期間内',
          ruleType: '日付整合性',
          isActive: true,
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

    expect(result.closingPeriod.periodStartDate).toEqual(new Date('2025-01-01'));
    expect(result.closingPeriod.periodEndDate).toEqual(new Date('2025-01-31'));

    expect(result.extractionScope.dealIds).toContain('D-001');
    expect(result.extractionScope.dealIds).toContain('D-002');
    expect(result.extractionScope.totalDealCount).toBe(2);

    expect(result.extractionScope.invoiceIds).toContain('INV-001');
    expect(result.extractionScope.invoiceIds).toContain('INV-002');
    expect(result.extractionScope.totalInvoiceCount).toBe(2);

    expect(result.extractionCriteria.dealStageFilter).toContain('成約済み');
    expect(result.extractionCriteria.invoiceStatusFilter).toContain('発行済み');

    // Verify amount reconciliation checkpoints
    expect(result.extractionScope.dataIntegrityCheckpoints).toContainEqual(
      expect.objectContaining({
        checkpoint: expect.any(String),
        description: expect.stringContaining('金額'),
      }),
    );

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();
  });
});
