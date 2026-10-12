import { transitionDealStage } from '../../src/logic/deal-stage-transition';
import { fetchAllDealStages, fetchDealStageTransitionRules, fetchDealById } from '../../src/logic/data-persistence';
import type { TransitionDealStageInput, TransitionDealStageOutput } from '../../src/logic/deal-stage-transition';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-147: 営業プロセス定義から現在のステージの許可遷移先リストを取得し、指定された遷移先がそのリストに含まれることを確認する', () => {
  const mockFetchAllDealStages = fetchAllDealStages as jest.Mock;
  const mockFetchDealStageTransitionRules = fetchDealStageTransitionRules as jest.Mock;
  const mockFetchDealById = fetchDealById as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('遷移先ステージが許可されているが、必須フィールドが不足しているため、success: false で返される', async () => {
    const input: TransitionDealStageInput = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      targetStage: '提案',
      userId: 'user-sales-001',
      executionTimestamp: 1704067200000,
    };

    mockFetchAllDealStages.mockResolvedValue({
      stages: [
        {
          stageId: 'stage-001',
          stageName: '初期接触',
          stageOrder: 1,
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
      totalCount: 2,
      fetchedAt: '2024-01-01T00:00:00Z',
    });

    mockFetchDealStageTransitionRules.mockResolvedValue({
      stages: [
        {
          stageId: 'stage-001',
          stageName: '初期接触',
          stageOrder: 1,
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
      dealName: 'ABC株式会社 システム導入',
      currentStage: '初期接触',
      dealAmount: 0,
      customerId: 'cust-001',
      salesRepresentativeId: 'user-sales-001',
      stageId: 'stage-001',
      expectedContractDate: '2024-12-31',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-sales-001',
    });

    const result = await transitionDealStage(input);

    expect(result.success).toBe(false);
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.previousStage).toBe('初期接触');
    expect(result.newStage).toBeNull();
    expect(result.validationResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          validationType: expect.any(String),
          passed: expect.any(Boolean),
          details: expect.stringContaining('顧客名'),
        }),
        expect.objectContaining({
          validationType: expect.any(String),
          passed: expect.any(Boolean),
          details: expect.stringContaining('商品'),
        }),
      ])
    );
    expect(result.invoiceConsistencyStatus).toBeNull();
    expect(result.transitionTimestamp).toBeNull();
    expect(result.errorDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          errorMessage: expect.stringContaining('遷移先ステージに必要な項目が未入力です'),
        }),
      ])
    );
  });
});
