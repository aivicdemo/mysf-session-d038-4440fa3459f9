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

describe('SCEN-237: 対象期間内に抽出対象データが存在しないか定義ルールが矛盾している場合、ExtractionScopeDefinitionFailedエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象期間内にデータが存在しない場合、ExtractionScopeDefinitionFailedエラーが発生する', async () => {
    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue([
      { stageId: 'DS-001', stageName: '成約済み' },
      { stageId: 'DS-002', stageName: 'クローズ' },
    ]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue([
      { ruleId: 'VR-001', objectName: '商談', condition: 'ステータス=成約済み AND 請求日が対象期間内', isActive: true },
      { ruleId: 'VR-002', objectName: '請求', condition: '請求日が対象期間内', isActive: true },
    ]);

    await expect(
      prepareMonthlyClosing({
        closingInstructionId: 'CI-2024-12-001',
        targetMonth: '2024-12',
        operatorUserId: 'USR-OP-001',
        executionTimestamp: new Date('2024-12-31T09:00:00Z'),
      })
    ).rejects.toThrow(ExtractionScopeDefinitionFailed);

    try {
      await prepareMonthlyClosing({
        closingInstructionId: 'CI-2024-12-001',
        targetMonth: '2024-12',
        operatorUserId: 'USR-OP-001',
        executionTimestamp: new Date('2024-12-31T09:00:00Z'),
      });
    } catch (error) {
      if (error instanceof ExtractionScopeDefinitionFailed) {
        expect(error.message).toContain('抽出範囲の定義に失敗しました。対象期間のデータを確認してください。');
      }
    }
  });
});
