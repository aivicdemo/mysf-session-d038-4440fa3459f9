import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-444: dealStageProgressMetrics aggregation', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate deal stage progress metrics with stage order and target differences', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-30T23:59:59Z');
    const requestingUserId = 'user-rep-001';

    // Setup mocks
    (mockDataPersistence.fetchAllSalesRepresentatives as jest.Mock) = jest.fn().mockResolvedValue([
      { repId: 'rep-001', repName: '山田太郎', departmentId: 'dept-sales' },
      { repId: 'rep-002', repName: '鈴木花子', departmentId: 'dept-sales' },
    ]);

    (mockDataPersistence.fetchActivitiesByRepresentative as jest.Mock) = jest.fn().mockResolvedValue([
      { repId: 'rep-001', activityId: 'act-001', activityType: '訪問', activityDate: '2024-11-05', customerId: 'cust-001' },
      { repId: 'rep-001', activityId: 'act-002', activityType: '電話', activityDate: '2024-11-10', customerId: 'cust-002' },
      { repId: 'rep-002', activityId: 'act-003', activityType: 'メール', activityDate: '2024-11-15', customerId: 'cust-003' },
    ]);

    (mockDataPersistence.fetchDealsForPeriod as jest.Mock) = jest.fn().mockResolvedValue([
      { dealId: 'deal-001', repId: 'rep-001', stageId: 'stage-initial', stageName: '初期接触', amount: 500000, customerId: 'cust-001', status: 'open' },
      { dealId: 'deal-002', repId: 'rep-001', stageId: 'stage-proposal', stageName: '提案', amount: 1000000, customerId: 'cust-002', status: 'open' },
      { dealId: 'deal-003', repId: 'rep-001', stageId: 'stage-negotiation', stageName: '交渉', amount: 800000, customerId: 'cust-001', status: 'open' },
      { dealId: 'deal-004', repId: 'rep-002', stageId: 'stage-initial', stageName: '初期接触', amount: 300000, customerId: 'cust-003', status: 'open' },
      { dealId: 'deal-005', repId: 'rep-002', stageId: 'stage-proposal', stageName: '提案', amount: 700000, customerId: 'cust-004', status: 'open' },
    ]);

    (mockDataPersistence.fetchSalesTargets as jest.Mock) = jest.fn().mockResolvedValue([
      { repId: 'rep-001', period: '2024-11', targetAmount: 3000000, targetActivityCount: 10 },
      { repId: 'rep-002', period: '2024-11', targetAmount: 2000000, targetActivityCount: 8 },
    ]);

    (mockDataPersistence.fetchAllDealStages as jest.Mock) = jest.fn().mockResolvedValue([
      { stageId: 'stage-initial', stageName: '初期接触' },
      { stageId: 'stage-proposal', stageName: '提案' },
      { stageId: 'stage-negotiation', stageName: '交渉' },
      { stageId: 'stage-closed', stageName: '成約' },
    ]);

    (mockDataPersistence.fetchUserPermissions as jest.Mock) = jest.fn().mockResolvedValue({
      userId: 'user-rep-001',
      canViewDashboard: true,
      canViewAllData: true,
      allowedRepIds: ['rep-001', 'rep-002'],
    });

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(result.dealStageProgressMetrics).toHaveLength(4);

    // Verify stage order
    const stages = result.dealStageProgressMetrics;
    expect(stages[0].stageName).toBe('初期接触');
    expect(stages[1].stageName).toBe('提案');
    expect(stages[2].stageName).toBe('交渉');
    expect(stages[3].stageName).toBe('成約');

    // Verify stage metrics: 初期接触 (2 deals, 800,000)
    const initialStage = stages.find((s: any) => s.stageName === '初期接触');
    expect(initialStage.totalDealCount).toBe(2);
    expect(initialStage.totalDealAmount).toBe(800000);
    expect(initialStage.differenceFromTarget).toBe(-150000);

    // Verify stage metrics: 提案 (2 deals, 1,700,000)
    const proposalStage = stages.find((s: any) => s.stageName === '提案');
    expect(proposalStage.totalDealCount).toBe(2);
    expect(proposalStage.totalDealAmount).toBe(1700000);
    expect(proposalStage.differenceFromTarget).toBe(750000);

    // Verify stage metrics: 交渉 (1 deal, 800,000)
    const negotiationStage = stages.find((s: any) => s.stageName === '交渉');
    expect(negotiationStage.totalDealCount).toBe(1);
    expect(negotiationStage.totalDealAmount).toBe(800000);
    expect(negotiationStage.differenceFromTarget).toBe(-150000);

    // Verify stage metrics: 成約 (0 deals)
    const closedStage = stages.find((s: any) => s.stageName === '成約');
    expect(closedStage.totalDealCount).toBe(0);
    expect(closedStage.totalDealAmount).toBe(0);
    expect(closedStage.differenceFromTarget).toBe(-950000);
  });
});
