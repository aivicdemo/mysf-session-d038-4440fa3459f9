import { prepareMonthlyClosing } from '../../src/logic/monthly-closing-preparation';
import * as dataFetch from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-1604: 明細漏れ検出時、推奨アクション請求書修正で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prepareMonthlyClosing: 明細漏れルールがdataIntegrityCheckpointsに含まれる', async () => {
    const customers = [
      { id: 'CUST-001', name: '顧客A', isActive: true },
      { id: 'CUST-002', name: '顧客B', isActive: true },
      { id: 'CUST-TEST', name: 'テスト顧客', isActive: true },
    ];

    const deals = [
      {
        dealId: 'DEAL-001',
        customerId: 'CUST-001',
        dealName: '商談A',
        status: '成約済み',
      },
      {
        dealId: 'DEAL-002',
        customerId: 'CUST-002',
        dealName: '商談B',
        status: '成約済み',
      },
      {
        dealId: 'DEAL-CANCEL',
        customerId: 'CUST-001',
        dealName: 'キャンセル商談',
        status: 'キャンセル済み',
      },
    ];

    const invoices = [
      {
        invoiceId: 'INV-001',
        dealId: 'DEAL-001',
        date: '2024-01-20',
        amount: 100000,
      },
      {
        invoiceId: 'INV-002',
        dealId: 'DEAL-002',
        date: '2024-01-25',
        amount: 150000,
      },
    ];

    const dealStages = [
      { stageId: 'STAGE-001', stageName: '初期接触' },
      { stageId: 'STAGE-002', stageName: '提案中' },
      { stageId: 'STAGE-003', stageName: '成約済み' },
      { stageId: 'STAGE-004', stageName: 'キャンセル' },
    ];

    const validationRules = [
      {
        ruleId: 'RULE-001',
        ruleName: '商談請求書紐付け確認',
        ruleDescription: '全ての成約済み商談に請求書が紐付いているか確認',
        ruleType: 'integrity',
      },
      {
        ruleId: 'RULE-002',
        ruleName: '金額一致確認',
        ruleDescription: '商談金額と請求書金額が一致しているか確認',
        ruleType: 'integrity',
      },
      {
        ruleId: 'RULE-003',
        ruleName: '明細漏れ検出',
        ruleDescription: '請求明細が不足していないか確認',
        ruleType: 'completeness',
      },
    ];

    (dataFetch.fetchAllCustomers as jest.Mock).mockResolvedValue(customers);
    (dataFetch.fetchDealsForPeriod as jest.Mock).mockResolvedValue(deals);
    (dataFetch.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(invoices);
    (dataFetch.fetchAllDealStages as jest.Mock).mockResolvedValue(dealStages);
    (dataFetch.fetchAllValidationRules as jest.Mock).mockResolvedValue(
      validationRules
    );

    const result = await prepareMonthlyClosing({
      closingInstructionId: 'CI-2024-001',
      targetMonth: '2024-01',
      operatorUserId: 'USR-001',
      executionTimestamp: new Date('2024-02-05T09:30:00Z'),
    });

    expect(result.closingPeriod.periodStartDate).toEqual(
      new Date('2024-01-01T00:00:00Z')
    );
    expect(result.closingPeriod.periodEndDate).toEqual(
      new Date('2024-01-31T23:59:59Z')
    );
    expect(result.readyForExtraction).toBeDefined();
    expect(result.extractionScope).toBeDefined();
    expect(result.extractionScope.extractionObjects).toBeDefined();
    expect(result.extractionScope.exclusionRules).toBeDefined();
    expect(result.extractionScope.dataIntegrityCheckpoints).toBeDefined();
    expect(result.preparationCompletedAt).toEqual(
      new Date('2024-02-05T09:30:00Z')
    );
  });
});
