import {
  aggregateSalesPerformanceForDashboard,
  AggregateSalesPerformanceInput,
  AggregateSalesPerformanceOutput,
} from '../../src/logic/sales-performance-aggregation';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

jest.mock('../../src/logic/access-control-enforcement', () => ({
  ...jest.requireActual<typeof import('../../src/logic/access-control-enforcement')>(
    '../../src/logic/access-control-enforcement'
  ),
  enforceAccessControlForDataDisplay: jest.fn(),
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import * as accessControl from '../../src/logic/access-control-enforcement';

describe('SCEN-397: aggregateSalesPerformanceForDashboard - 正常系', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象期間内に営業実績・商談・目標データが揃っており、権限のあるユーザーが要求したとき、営業担当者別の活動実績・ステージ別進捗・指導優先度スコアを含むダッシュボード表示データが生成される', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-30T23:59:59Z');
    const requestingUserId = 'user-mgr-001';

    const mockRepresentatives = [
      { repId: 'rep-001', repName: '営業太郎', department: '営業部', status: 'active' },
      { repId: 'rep-002', repName: '営業花子', department: '営業部', status: 'active' },
    ];

    const mockActivities = [
      { activityId: 'act-001', repId: 'rep-001', activityType: 'visit', activityDate: '2024-11-05', status: 'completed' },
      { activityId: 'act-002', repId: 'rep-001', activityType: 'call', activityDate: '2024-11-10', status: 'completed' },
      { activityId: 'act-003', repId: 'rep-002', activityType: 'email', activityDate: '2024-11-08', status: 'completed' },
    ];

    const mockDeals = [
      { dealId: 'deal-001', repId: 'rep-001', dealName: 'A社案件', amount: 5000000, stage: 'negotiation', status: 'active', customerId: 'cust-001' },
      { dealId: 'deal-002', repId: 'rep-001', dealName: 'B社案件', amount: 3000000, stage: 'won', status: 'completed', customerId: 'cust-002' },
      { dealId: 'deal-003', repId: 'rep-002', dealName: 'C社案件', amount: 2000000, stage: 'initial', status: 'active', customerId: 'cust-003' },
    ];

    const mockTargets = [
      { repId: 'rep-001', targetPeriod: '2024-11', targetAmount: 10000000, targetActivityCount: 10 },
      { repId: 'rep-002', targetPeriod: '2024-11', targetAmount: 8000000, targetActivityCount: 8 },
    ];

    const mockStages = [
      { stageId: 'stage-001', stageName: 'initial', stageOrder: 1 },
      { stageId: 'stage-002', stageName: 'proposal', stageOrder: 2 },
      { stageId: 'stage-003', stageName: 'negotiation', stageOrder: 3 },
      { stageId: 'stage-004', stageName: 'won', stageOrder: 4 },
    ];

    const mockPermissions = {
      userId: 'user-mgr-001',
      roles: ['manager'],
      permissions: ['view_dashboard', 'view_all_sales_data', 'view_coaching_priority'],
      viewableRepIds: ['rep-001', 'rep-002'],
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockRepresentatives);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue(mockActivities);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValue(mockTargets);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockStages);
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(mockPermissions);

    const input: AggregateSalesPerformanceInput = {
      targetPeriod,
      currentDate,
      requestingUserId,
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2024-11');
    expect(result.aggregationTimestamp).toEqual(currentDate);

    // 活動実績の検証
    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(result.activityMetricsByRepresentative.length).toBe(2);

    const rep001Activity = result.activityMetricsByRepresentative.find(m => m.representativeId === 'rep-001');
    expect(rep001Activity).toBeDefined();
    expect(rep001Activity?.totalActivityCount).toBe(2);
    expect(rep001Activity?.targetActivityCount).toBe(10);
    expect(rep001Activity?.achievementPercentage).toBe(20);

    const rep002Activity = result.activityMetricsByRepresentative.find(m => m.representativeId === 'rep-002');
    expect(rep002Activity).toBeDefined();
    expect(rep002Activity?.totalActivityCount).toBe(1);
    expect(rep002Activity?.targetActivityCount).toBe(8);
    expect(rep002Activity?.achievementPercentage).toBe(12.5);

    // 商談ステージ別進捗の検証
    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(result.dealStageProgressMetrics.length).toBe(4);

    const initialStage = result.dealStageProgressMetrics.find(s => s.stageName === 'initial');
    expect(initialStage?.totalDealCount).toBe(1);
    expect(initialStage?.totalDealAmount).toBe(2000000);

    const proposalStage = result.dealStageProgressMetrics.find(s => s.stageName === 'proposal');
    expect(proposalStage?.totalDealCount).toBe(0);
    expect(proposalStage?.totalDealAmount).toBe(0);

    const negotiationStage = result.dealStageProgressMetrics.find(s => s.stageName === 'negotiation');
    expect(negotiationStage?.totalDealCount).toBe(1);
    expect(negotiationStage?.totalDealAmount).toBe(5000000);

    const wonStage = result.dealStageProgressMetrics.find(s => s.stageName === 'won');
    expect(wonStage?.totalDealCount).toBe(1);
    expect(wonStage?.totalDealAmount).toBe(3000000);

    // 指導優先度ランキングの検証
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking.length).toBe(2);

    const rank1 = result.coachingPriorityRanking.find(r => r.rank === 1);
    expect(rank1?.representativeId).toBe('rep-002');
    expect(rank1?.priorityScore).toBe(71);
    expect(rank1?.priorityLevel).toBe('高');

    const rank2 = result.coachingPriorityRanking.find(r => r.rank === 2);
    expect(rank2?.representativeId).toBe('rep-001');
    expect(rank2?.priorityScore).toBe(48);
    expect(rank2?.priorityLevel).toBe('中');

    // 異常値の検証
    expect(result.anomalousMetrics).toBeDefined();
    expect(result.anomalousMetrics.length).toBeGreaterThanOrEqual(3);

    const activityCountAnomalies = result.anomalousMetrics.filter(a => a.metricName === 'activityCount');
    expect(activityCountAnomalies.length).toBeGreaterThanOrEqual(2);

    const dealAmountAnomalies = result.anomalousMetrics.filter(a => a.metricName === 'dealAmount');
    expect(dealAmountAnomalies.length).toBeGreaterThanOrEqual(1);

    // データ鮮度ステータスの検証
    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toEqual(currentDate);
    expect(result.dataFreshnessStatus.isFresh).toBe(true);

    // 依存関数の呼び出し確認
    expect(dataPersistence.fetchAllSalesRepresentatives).toHaveBeenCalled();
    expect(dataPersistence.fetchActivitiesByRepresentative).toHaveBeenCalled();
    expect(dataPersistence.fetchDealsForPeriod).toHaveBeenCalled();
    expect(dataPersistence.fetchSalesTargets).toHaveBeenCalled();
    expect(dataPersistence.fetchAllDealStages).toHaveBeenCalled();
    expect(accessControl.enforceAccessControlForDataDisplay).toHaveBeenCalled();
  });
});
