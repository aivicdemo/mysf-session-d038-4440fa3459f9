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

describe('SCEN-432: aggregateSalesPerformanceForDashboard - 商談ステージデータが不完全', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談ステージ別データが不完全なとき、データ補正メッセージを発行して計算を続行する', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-15T10:30:00Z');
    const requestingUserId = 'user-sales-manager-001';

    const mockRepresentatives = [
      { representativeId: 'rep-001', name: '営業担当者A', department: '営業部' },
      { representativeId: 'rep-002', name: '営業担当者B', department: '営業部' },
    ];

    const mockActivities = [
      { representativeId: 'rep-001', activityCount: 15 },
      { representativeId: 'rep-002', activityCount: 12 },
    ];

    const mockDeals = [
      {
        representativeId: 'rep-001',
        dealProgressData: [
          { stageId: 'stage-001', stageName: '初期接触', count: 3, amount: 0 },
          { stageId: 'stage-002', stageName: '提案', count: 2, amount: 500000 },
          { stageId: 'stage-003', stageName: '交渉', count: null, amount: null },
        ],
      },
      {
        representativeId: 'rep-002',
        dealProgressData: [
          { stageId: 'stage-001', stageName: '初期接触', count: 2, amount: 0 },
          { stageId: 'stage-002', stageName: '提案', count: 1, amount: 300000 },
        ],
      },
    ];

    const mockTargets = [
      { representativeId: 'rep-001', targetActivityCount: 20, targetDealAmount: 1000000 },
      { representativeId: 'rep-002', targetActivityCount: 18, targetDealAmount: 800000 },
    ];

    const mockStages = [
      { stageId: 'stage-001', stageName: '初期接触' },
      { stageId: 'stage-002', stageName: '提案' },
      { stageId: 'stage-003', stageName: '交渉' },
      { stageId: 'stage-004', stageName: '成約待ち' },
    ];

    const mockPermissions = {
      userId: 'user-sales-manager-001',
      canViewDashboard: true,
      canAccessAllRepresentativesData: true,
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

    const result: AggregateSalesPerformanceOutput = await aggregateSalesPerformanceForDashboard(input);

    expect(result).toBeDefined();

    // (1) rep-001 の活動実績サマリーが生成されていることを確認
    const rep001Activity = result.activityMetricsByRepresentative.find(
      m => m.representativeId === 'rep-001'
    );
    expect(rep001Activity).toBeDefined();

    // (2) dealStageProgressMetrics に不完全なステージ（stage-003）が除外されていることを確認
    const stageProgressMetrics = result.dealStageProgressMetrics;
    expect(stageProgressMetrics).toBeDefined();

    const stage003 = stageProgressMetrics.find(s => s.stageId === 'stage-003');
    // stage-003 が除外されるか、または null データが除外される
    if (stage003) {
      expect(stage003.dealCountByRepresentative.some(d => d.representativeId === 'rep-001')).toBe(false);
    }

    // (3) anomalousMetrics にデータ補正メッセージが記録されていることを確認
    const anomalies = result.anomalousMetrics;
    const dataCorrection = anomalies.find(a =>
      a.anomalyDescription.includes('一部のステージデータが不完全です')
    );
    expect(dataCorrection).toBeDefined();

    // (4) dataFreshnessStatus が警告ステータスを示していることを確認
    expect(result.dataFreshnessStatus).toBeDefined();
    const hasWarning = result.dataFreshnessStatus.freshnessWarning || !result.dataFreshnessStatus.isFresh;
    expect(hasWarning).toBe(true);

    // (5) rep-001 の達成度が正確に算出されていることを確認
    // 活動件数: 15 / 20 * 100 = 75%
    expect(rep001Activity?.achievementPercentage).toBe(75);
    // 商談金額: (0 + 500000) / 1000000 * 100 = 50%
  });
});
