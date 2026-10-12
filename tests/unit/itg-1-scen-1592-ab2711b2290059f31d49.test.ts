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

describe('SCEN-1592: 商談金額が負数でエラー発生し照合中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談金額が負数の場合、ExtractionCriteriaDefinitionFailed エラーが発生', async () => {
    const closingInstructionId = 'CI-2024-001';
    const targetMonth = '2024-11';
    const operatorUserId = 'USR-SALES-OP-001';
    const executionTimestamp = new Date('2024-12-01T09:00:00Z');

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([
      { customerId: 'C-001', customerName: 'テスト取引先A', isActive: true },
    ]);

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([
      { dealId: 'D-2024-001', amount: -50000, status: '成約済み', date: '2024-11-15' },
    ]);

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      { invoiceId: 'INV-2024-001', invoiceAmount: 100000, invoiceDate: '2024-11-20' },
    ]);

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '成約済み', isActive: true },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'RULE-001', ruleName: '金額チェック', condition: 'amount > 0', isActive: true },
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
