import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1582: 期待金額と計算済み金額の差が0.01円以上なら行金額計算誤り検出', () => {
  it('商談と請求金額の差が0.01円以上の場合、readyForExtractionがfalseで返される', async () => {
    const mockCustomers = [
      { customerId: 'CUST-001', customerName: '取引先A', isActive: true, isTestData: false },
      { customerId: 'CUST-002', customerName: '取引先B', isActive: true, isTestData: false },
    ];
    const mockDeals = [
      {
        dealId: 'DEAL-001',
        dealName: '商談A',
        status: '成約済み',
        amount: 1000000,
        invoiceAmount: 1000000,
        invoiceDate: '2025-01-10',
        customerId: 'CUST-001',
      },
      {
        dealId: 'DEAL-002',
        dealName: '商談B',
        status: '成約済み',
        amount: 500000,
        invoiceAmount: 500000.01,
        invoiceDate: '2025-01-15',
        customerId: 'CUST-002',
      },
    ];
    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'DEAL-001',
        amount: 1000000,
        invoiceDate: '2025-01-10',
        status: '発行済み',
      },
      {
        invoiceId: 'INV-002',
        dealId: 'DEAL-002',
        amount: 500000.01,
        invoiceDate: '2025-01-15',
        status: '発行済み',
      },
    ];
    const mockDealStages = [
      { stageId: 'STAGE-001', stageName: '成約済み', isFinal: true },
      { stageId: 'STAGE-002', stageName: 'キャンセル', isFinal: false },
    ];
    const mockValidationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '商談と請求金額一致確認',
        ruleType: 'AmountDifference',
        threshold: 0.01,
        comparisonFields: ['amount', 'invoiceAmount'],
        isActive: true,
      },
      {
        ruleId: 'RULE-002',
        ruleName: '請求書との紐付け確認',
        ruleType: 'ReconciliationCheck',
        threshold: 0,
        isActive: true,
      },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const input = {
      closingInstructionId: 'CI-2025-01-001',
      targetMonth: '2025-01',
      operatorUserId: 'USR-SYS-OPERATOR-001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    const result = await prepareMonthlyClosing(input);

    expect(result.readyForExtraction).toBe(false);
    expect(result.closingPeriod.targetMonth).toBe('2025-01');
    expect(result.extractionCriteria).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(new Date('2025-01-15T09:00:00Z'));
  });
});
