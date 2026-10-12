import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistenceModule from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof dataPersistenceModule>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-419: aggregateSalesPerformanceForDashboard が正常に実行され、集計データが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常系：営業担当者の活動実績・商談ステージ別進捗・目標達成度が正しく集計される', async () => {
    const mockDataPersistence = dataPersistenceModule as jest.Mocked<typeof dataPersistenceModule>;

    // fetchAllSalesRepresentatives のモック
    (mockDataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: [
        {
          salesRepresentativeId: 'REP-00001',
          name: '山田太郎',
          emailAddress: 'yamada@example.com',
          phoneNumber: '090-1234-5678',
          department: '営業部',
          jobTitle: null,
          supervisorId: null,
          status: 'active',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: null,
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    // fetchActivitiesByRepresentative のモック
    (mockDataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue({
      activities: [
        {
          activityId: 'ACT-001',
          customerId: 'CUST-00001',
          salesRepresentativeId: 'REP-00001',
          activityType: '訪問',
          activityDateTime: '2025-01-10T09:00:00Z',
          activityContent: '顧客訪問',
          nextFollowUpScheduledDate: '2025-01-17',
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 60,
          activityCount: 1,
          activityFrequency: 'weekly',
          activityResult: 'successful',
          nextAction: null,
          createdAt: '2025-01-10T09:00:00Z',
          updatedAt: '2025-01-10T09:00:00Z',
          createdBy: 'REP-00001',
        },
        {
          activityId: 'ACT-002',
          customerId: 'CUST-00001',
          salesRepresentativeId: 'REP-00001',
          activityType: '訪問',
          activityDateTime: '2025-01-11T10:00:00Z',
          activityContent: '顧客訪問',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 45,
          activityCount: 1,
          activityFrequency: 'weekly',
          activityResult: 'successful',
          nextAction: null,
          createdAt: '2025-01-11T10:00:00Z',
          updatedAt: '2025-01-11T10:00:00Z',
          createdBy: 'REP-00001',
        },
      ],
      totalCount: 25,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    // fetchDealsForPeriod のモック
    (mockDataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-20250001',
          customerId: 'CUST-00001',
          salesRepresentativeId: 'REP-00001',
          dealName: '大型案件A',
          dealAmount: 500000,
          stageId: 'STAGE-002',
          expectedContractDate: '2025-02-28',
          contractedDate: null,
          description: '提案中の案件',
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2025-01-05T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          createdBy: 'REP-00001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    // fetchSalesTargets のモック
    (mockDataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValue({
      salesTargets: [
        {
          salesTargetId: 'TARGET-001',
          salesRepresentativeId: 'REP-00001',
          customerId: null,
          targetYearMonth: '2025-01',
          targetAmount: 2000000,
          targetCount: 30,
          status: 'active',
          remarks: null,
          createdAt: '2024-12-20T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedAt: '2024-12-20T00:00:00Z',
          updatedBy: null,
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    // fetchAllDealStages のモック
    (mockDataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        {
          stageId: 'STAGE-001',
          stageName: '初期接触',
          stageOrder: 1,
          description: '初期段階',
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: null,
        },
        {
          stageId: 'STAGE-002',
          stageName: '提案',
          stageOrder: 2,
          description: '提案段階',
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: null,
        },
        {
          stageId: 'STAGE-003',
          stageName: '交渉',
          stageOrder: 3,
          description: '交渉段階',
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: null,
        },
        {
          stageId: 'STAGE-004',
          stageName: '成約待ち',
          stageOrder: 4,
          description: '成約待ち段階',
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: null,
        },
      ],
      totalCount: 4,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    // fetchUserPermissions のモック
    (mockDataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      permissions: [
        {
          permissionId: 'PERM-001',
          userId: 'USER-00001',
          permissionCode: 'VIEW_DASHBOARD',
          permissionName: 'ダッシュボード表示権限',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: null,
        },
        {
          permissionId: 'PERM-002',
          userId: 'USER-00001',
          permissionCode: 'ACCESS_ALL_REP_DATA',
          permissionName: '全営業担当者データアクセス権限',
          description: null,
          validFlag: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          createdBy: 'SYSTEM',
          updatedBy: null,
        },
      ],
      totalCount: 2,
      fetchedAt: '2025-01-15T10:30:00Z',
    });

    const input = {
      targetPeriod: '2025-01',
      currentDate: new Date('2025-01-15T10:30:00Z'),
      requestingUserId: 'USER-00001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    // 出力の基本構造を確認
    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2025-01');
    expect(result.aggregationTimestamp).toEqual(new Date('2025-01-15T10:30:00Z'));

    // 営業担当者別活動実績が含まれている
    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(Array.isArray(result.activityMetricsByRepresentative)).toBe(true);
    expect(result.activityMetricsByRepresentative.length).toBeGreaterThan(0);

    const activityMetrics = result.activityMetricsByRepresentative[0];
    expect(activityMetrics.representativeId).toBe('REP-00001');
    expect(activityMetrics.representativeName).toBe('山田太郎');
    expect(activityMetrics.totalActivityCount).toBe(25);
    expect(activityMetrics.targetActivityCount).toBe(30);
    // 達成度 = 25 / 30 = 83.3%
    expect(activityMetrics.achievementPercentage).toBeCloseTo(83.33, 1);
    expect(activityMetrics.isAnomalous).toBe(true);
    expect(activityMetrics.anomalyReason).toBeDefined();

    // 商談ステージ別進捗が含まれている
    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(Array.isArray(result.dealStageProgressMetrics)).toBe(true);
    expect(result.dealStageProgressMetrics.length).toBe(4);

    const proposalStage = result.dealStageProgressMetrics.find(m => m.stageId === 'STAGE-002');
    expect(proposalStage).toBeDefined();
    expect(proposalStage!.stageName).toBe('提案');
    expect(proposalStage!.stageOrder).toBe(2);
    expect(proposalStage!.totalDealCount).toBe(1);
    expect(proposalStage!.totalDealAmount).toBe(500000);

    // 指導優先度ランキングが含まれている
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(Array.isArray(result.coachingPriorityRanking)).toBe(true);
    expect(result.coachingPriorityRanking.length).toBeGreaterThan(0);

    const coachingRank = result.coachingPriorityRanking[0];
    expect(coachingRank.rank).toBe(1);
    expect(coachingRank.representativeId).toBe('REP-00001');
    expect(coachingRank.representativeName).toBe('山田太郎');
    expect(coachingRank.priorityScore).toBeDefined();
    expect(coachingRank.priorityLevel).toBeDefined();
    expect(coachingRank.scoringFactors).toBeDefined();
    expect(Array.isArray(coachingRank.scoringFactors)).toBe(true);
    expect(coachingRank.recommendedAction).toBeDefined();

    // 異常値が検出されている
    expect(result.anomalousMetrics).toBeDefined();
    expect(Array.isArray(result.anomalousMetrics)).toBe(true);
    expect(result.anomalousMetrics.length).toBeGreaterThan(0);

    const anomaly = result.anomalousMetrics.find(a => a.representativeId === 'REP-00001' && a.metricName.includes('活動'));
    expect(anomaly).toBeDefined();
    expect(anomaly!.anomalyDescription).toBeDefined();
    expect(anomaly!.expectedValue).toBe(30);
    expect(anomaly!.actualValue).toBe(25);
    expect(anomaly!.severity).toBeDefined();
    expect(anomaly!.recommendedResponse).toBeDefined();

    // データの鮮度状態が含まれている
    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toEqual(new Date('2025-01-15T10:30:00Z'));
    expect(result.dataFreshnessStatus.dataAgeMinutes).toBeDefined();
    expect(result.dataFreshnessStatus.freshnessThresholdMinutes).toBeDefined();
    expect(result.dataFreshnessStatus.isFresh).toBe(true);
  });
});
