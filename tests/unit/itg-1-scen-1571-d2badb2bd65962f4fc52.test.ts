import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1571: 営業プロセス全体のデータフロー内で異常値・未完了案件が自動検知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should automatically detect anomalies and incomplete deals in sales process data flow', async () => {
    const closingInstructionId = 'CI-2025-01-001';
    const targetMonth = '2025-01';
    const operatorUserId = 'USR-SALES-OPS-001';
    const executionTimestamp = new Date('2025-02-01T09:00:00Z');

    // Mock fetchAllCustomers
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({
      customers: [
        { customerId: 'C001', customerName: '取引先A', status: 'Active' },
        { customerId: 'C002', customerName: 'テスト取引先', status: 'Active' },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchDealsForPeriod
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'D001',
          dealName: '商談1',
          status: 'Closed Won',
          amount: 500000,
          customerId: 'C001',
        },
        {
          dealId: 'D002',
          dealName: '商談2',
          status: 'Closed Lost',
          amount: 300000,
          customerId: 'C001',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'INV001',
          dealId: 'D001',
          amount: 500000,
          status: 'Issued',
        },
        {
          invoiceId: 'INV002',
          dealId: 'D002',
          amount: 300000,
          status: 'Issued',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        { stageId: 'S1', stageName: 'Prospecting', sequenceNumber: 1 },
        { stageId: 'S2', stageName: 'Closed Won', sequenceNumber: 5 },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      rules: [
        {
          ruleId: 'VR1',
          ruleName: 'Deal-Invoice金額一致確認',
          checkType: 'AmountReconciliation',
          severity: 'Critical',
        },
        {
          ruleId: 'VR2',
          ruleName: '商談ステータス整合性',
          checkType: 'StatusConsistency',
          severity: 'High',
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

    expect(result.extractionScope.totalCustomerCount).toBe(2);
    expect(result.extractionScope.totalDealCount).toBeGreaterThanOrEqual(1);
    expect(result.extractionScope.totalInvoiceCount).toBeGreaterThanOrEqual(1);

    // Verify exclusion rules include closed lost deals and test customers
    expect(result.extractionScope.exclusionRules).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Closed Lost'),
      ]),
    );

    // Verify extraction criteria includes validation rules
    expect(result.extractionCriteria.validationRulesToApply).toContainEqual(
      expect.stringContaining('VR'),
    );

    expect(result.readyForExtraction).toBe(true);
    expect(result.preparationCompletedAt).toBeDefined();
  });
});
