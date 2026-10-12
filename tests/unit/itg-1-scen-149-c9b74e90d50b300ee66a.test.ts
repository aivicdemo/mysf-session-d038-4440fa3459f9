import { transitionDealStage, StageDefinitionNotFoundError } from '../../src/logic/deal-stage-transition';
import { fetchAllDealStages, fetchDealStageTransitionRules, fetchDealById } from '../../src/logic/data-persistence';
import type { TransitionDealStageInput } from '../../src/logic/deal-stage-transition';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-149: 遷移先ステージが営業プロセス定義に存在しない場合、throw で指定メッセージが返される', () => {
  const mockFetchAllDealStages = fetchAllDealStages as jest.Mock;
  const mockFetchDealStageTransitionRules = fetchDealStageTransitionRules as jest.Mock;
  const mockFetchDealById = fetchDealById as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('遷移先ステージが営業プロセス定義に存在しないとき、StageDefinitionNotFoundError がthrowされ、指定されたステージは存在しません', async () => {
    const input: TransitionDealStageInput = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      targetStage: '非存在ステージ名',
      userId: 'user-001',
      executionTimestamp: 1672531200000,
    };

    mockFetchAllDealStages.mockResolvedValue({
      stages: [
        {
          stageId: 'stage-002',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-003',
          stageName: '交渉',
          stageOrder: 3,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-01T00:00:00Z',
    });

    mockFetchDealStageTransitionRules.mockResolvedValue({
      stages: [
        {
          stageId: 'stage-002',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-01T00:00:00Z',
    });

    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談',
      currentStage: '提案',
      dealAmount: 100000,
      customerId: 'cust-001',
      salesRepresentativeId: 'user-001',
      stageId: 'stage-002',
      expectedContractDate: '2024-12-31',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-001',
    });

    await expect(transitionDealStage(input)).rejects.toThrow(StageDefinitionNotFoundError);
    await expect(transitionDealStage(input)).rejects.toThrow(
      'ステージ定義が見つかりません: 非存在ステージ名。'
    );
  });
});
