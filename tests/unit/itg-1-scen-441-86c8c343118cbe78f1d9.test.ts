import { aggregateSalesPerformanceForDashboard, type AggregateSalesPerformanceInput, type AggregateSalesPerformanceOutput } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-441: calculateCoachingPriorityRanking - activityCount が負の値のとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('活動件数が負の値のとき、警告「実績値に異常がある可能性があります」を発行する', async () => {
    const mockFetchAllSalesRepresentatives = jest.mocked(dataPersistence.fetchAllSalesRepresentatives);
    const mockFetchActivitiesByRepresentative = jest.mocked(dataPersistence.fetchActivitiesByRepresentative);
    const mockFetchDealsForPeriod = jest.mocked(dataPersistence.fetchDealsForPeriod);
    const mockFetchSalesTargets = jest.mocked(dataPersistence.fetchSalesTargets);
    const mockFetchAllDealStages = jest.mocked(dataPersistence.fetchAllDealStages);
    const mockFetchUserPermissions = jest.mocked(dataPersistence.fetchUserPermissions);

    // 前提: fetchAllSalesRepresentatives の戻り値
    mockFetchAllSalesRepresentatives.mockResolvedValue({
      salesRepresentatives: [
        {
          salesRepresentativeId: 'rep-001',
          name: '山田太郎',
          emailAddress: 'yamada@example.com',
          phoneNumber: null,
          department: '営業部',
          jobTitle: null,
          supervisorId: null,
          status: 'active',
          createdAt: '2020-01-01',
          updatedAt: '2024-01-31T23:59:59Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T23:59:59Z',
    });

    // 前提: fetchActivitiesByRepresentative の戻り値 (activityCount が -5)
    mockFetchActivitiesByRepresentative.mockResolvedValue({
      activities: [
        {
          activityId: 'act-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          activityType: '訪問',
          activityDateTime: '2024-01-15T10:00:00Z',
          activityContent: 'Test activity',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 30,
          activityCount: -5,
          activityFrequency: '初回',
          activityResult: '成功',
          nextAction: null,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-31T23:59:59Z',
          createdBy: 'rep-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T23:59:59Z',
    });

    // 前提: fetchDealsForPeriod の戻り値
    mockFetchDealsForPeriod.mockResolvedValue({
      deals: [
        {
          dealId: 'deal-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          dealName: 'Test Deal',
          dealAmount: 500000,
          stageId: 'stage-02',
          expectedContractDate: '2024-01-31',
          contractedDate: null,
          description: 'Test',
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-28',
          createdBy: 'rep-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T23:59:59Z',
    });

    // 前提: fetchSalesTargets の戻り値
    mockFetchSalesTargets.mockResolvedValue({
      salesTargets: [
        {
          salesTargetId: 'target-001',
          salesRepresentativeId: 'rep-001',
          customerId: null,
          targetYearMonth: '2024-01',
          targetAmount: 1000000,
          targetCount: 20,
          status: 'active',
          remarks: null,
          createdAt: '2023-12-01',
          createdBy: 'system',
          updatedAt: '2024-01-31T23:59:59Z',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T23:59:59Z',
    });

    // 前提: fetchAllDealStages の戻り値
    mockFetchAllDealStages.mockResolvedValue({
      stages: [
        {
          stageId: 'stage-01',
          stageName: '初期接触',
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2020-01-01',
          updatedAt: '2020-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-02',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2020-01-01',
          updatedAt: '2020-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-31T23:59:59Z',
    });

    // 前提: fetchUserPermissions の戻り値
    mockFetchUserPermissions.mockResolvedValue({
      permissions: [
        {
          permissionId: 'perm-001',
          userId: 'user-sales-manager-001',
          permissionCode: 'VIEW_DASHBOARD',
          permissionName: 'ダッシュボード表示',
          description: 'ダッシュボード表示権限',
          validFlag: true,
          createdAt: '2020-01-01',
          updatedAt: '2024-01-31T23:59:59Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          permissionId: 'perm-002',
          userId: 'user-sales-manager-001',
          permissionCode: 'VIEW_ALL_REPRESENTATIVES',
          permissionName: '全営業担当者データ表示',
          description: '全営業担当者データ表示権限',
          validFlag: true,
          createdAt: '2020-01-01',
          updatedAt: '2024-01-31T23:59:59Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-31T23:59:59Z',
    });

    // テスト: aggregateSalesPerformanceForDashboard を呼び出す
    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-31T23:59:59Z'),
      requestingUserId: 'user-sales-manager-001',
    };

    const result: AggregateSalesPerformanceOutput = await aggregateSalesPerformanceForDashboard(input);

    // 期待結果: anomalousMetrics に activityCount が負の値のアラートが含まれる
    expect(result.anomalousMetrics).toBeDefined();
    expect(result.anomalousMetrics.length).toBeGreaterThan(0);

    const activityCountAlert = result.anomalousMetrics.find(
      (alert) => alert.metricName === 'activityCount' && alert.representativeId === 'rep-001'
    );

    expect(activityCountAlert).toBeDefined();
    expect(activityCountAlert?.anomalyDescription).toContain('活動件数が負の値');
    expect(activityCountAlert?.highlightColor).toBe('red');

    // 期待結果: CoachingPriorityRankingItem に activityPerformanceGap が正しく計算されている
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking.length).toBeGreaterThan(0);

    const rankingItem = result.coachingPriorityRanking.find(
      (item) => item.representativeId === 'rep-001'
    );

    expect(rankingItem).toBeDefined();

    // activityPerformanceGap = (20 - (-5)) / 20 * 100 = 125%
    const activityGapFactor = rankingItem?.scoringFactors.find(
      (factor) => factor.factorName.includes('activity') || factor.factorName.includes('Activity')
    );
    expect(activityGapFactor?.factorValue).toBe(125);
  });
});
