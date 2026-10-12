import { transitionDealStage, StageDefinitionNotFoundError } from '../../src/logic/deal-stage-transition';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-145: エラー系：遷移先ステージの定義がマスタに存在しない、または無効化されている場合、StageDefinitionNotFoundError が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('StageDefinitionNotFoundError が発生し、エラーメッセージに「ステージ定義が見つかりません: 成約。」を含む', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const executionTimestamp = 1700000000000;

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談',
      currentStage: '提案',
      dealAmount: 1000000,
      customerId: 'cust-001',
      customerName: 'テスト顧客',
      createdDate: 1699000000000,
    };

    // '成約' ステージが存在しないマスタ
    const mockDealStages = [
      { stage: '提案', order: 2, isClosedWon: false, isClosedLost: false, isActive: true },
    ];

    const mockStageTransitionRules = [
      { fromStage: '提案', allowedToStages: ['交渉', '成約待ち'] },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchDealStageTransitionRules as jest.Mock).mockResolvedValue(mockStageTransitionRules);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(StageDefinitionNotFoundError);

    await expect(
      transitionDealStage({
        dealId,
        targetStage,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(/ステージ定義が見つかりません: 成約/);
  });
});
