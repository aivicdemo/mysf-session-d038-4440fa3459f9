import { prepareMonthlyClosing, ExtractionCriteriaDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-1593: 請求金額が負数でエラー発生し照合中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求金額が負数の場合、ExtractionCriteriaDefinitionFailed エラーが発生', async () => {
    const closingInstructionId = 'INSTR-2024-001';
    const targetMonth = '2024-01';
    const operatorUserId = 'USER-OPERATOR-001';
    const executionTimestamp = new Date('2024-02-05T10:30:00Z');

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'CUST-001', customerName: 'テスト取引先A', isActive: true },
    ]);

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'DEAL-001', dealName: '案件001', status: 'closed_won', closedDate: '2024-01-10' },
    ]);

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-001', dealId: 'DEAL-001', invoiceAmount: -50000, invoiceDate: '2024-01-15', status: 'drafted' },
    ]);

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '成約済み', stageOrder: 5 },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: '請求金額チェック', condition: 'invoiceAmount > 0', errorMessage: '請求金額は正数である必要があります' },
    ]);

    await expect(
      prepareMonthlyClosing({
        closingInstructionId,
        targetMonth,
        operatorUserId,
        executionTimestamp,
      })
    ).rejects.toThrow(ExtractionCriteriaDefinitionFailed);

    try {
      await prepareMonthlyClosing({
        closingInstructionId,
        targetMonth,
        operatorUserId,
        executionTimestamp,
      });
    } catch (error) {
      expect((error as Error).message).toBe('抽出条件の定義に失敗しました。システム管理者に連絡してください。');
    }
  });
});
