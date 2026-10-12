import { prepareMonthlyClosing, ExtractionScopeDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllCustomers: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-241: 営業プロセスで有効なオブジェクトが1つも存在しない場合、有効なオブジェクト不在エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('有効なオブジェクトが全て無効の場合、ExtractionScopeDefinitionFailedエラーが発生する', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleName: 'SalesProcessObject_Account', isActive: false },
      { ruleName: 'SalesProcessObject_Contact', isActive: false },
      { ruleName: 'SalesProcessObject_Activity', isActive: false },
      { ruleName: 'SalesProcessObject_Opportunity', isActive: false },
      { ruleName: 'SalesProcessObject_Invoice', isActive: false },
    ]);

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'CI-2024-001',
        targetMonth: '2024-12',
        operatorUserId: 'USR-SALES-OPS-001',
        executionTimestamp: new Date('2024-12-15T09:00:00Z'),
      })
    ).rejects.toThrow(ExtractionScopeDefinitionFailed);

    try {
      await prepareMonthlyClosing({
        closingInstructionId: 'CI-2024-001',
        targetMonth: '2024-12',
        operatorUserId: 'USR-SALES-OPS-001',
        executionTimestamp: new Date('2024-12-15T09:00:00Z'),
      });
    } catch (error) {
      if (error instanceof ExtractionScopeDefinitionFailed) {
        expect(error.message).toContain('抽出範囲の定義に失敗しました。対象期間のデータを確認してください。');
      }
    }
  });
});
