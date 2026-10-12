import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof dataPersistence>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-421: aggregateSalesPerformanceForDashboard の正常系テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchAllSalesRepresentatives = dataPersistence.fetchAllSalesRepresentatives as jest.Mock;
    mockFetchAllSalesRepresentatives.mockResolvedValue({
      salesRepresentatives: [
        {
          salesRepresentativeId: 'REP-001',
          name: '営業太郎',
          emailAddress: 'taro@example.com',
          phoneNumber: null,
          department: '営業部',
          jobTitle: null,
          supervisorId: null,
          status: 'active',
          createdAt: '2023-01-01',
          updatedAt: '2024-01-01',
          createdBy: 'system',
          updatedBy: null,
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    });

    const mockFetchActivitiesByRepresentative = dataPersistence.fetchActivitiesByRepresentative as jest.Mock;
    mockFetchActivitiesByRepresentative.mockResolvedValue({
      activities: [
        {
          activityId: 'ACT-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          activityType: '訪問',
          activityDateTime: '2024-01-10T09:00:00Z',
          activityContent: 'プロジェクトA検討',
          nextFollowUpScheduledDate: '2024-01-15',
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 60,
          activityCount: 1,
          activityFrequency: 'first',
          activityResult: 'discussed',
          nextAction: null,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
          createdBy: 'REP-001',
        },
        {
          activityId: 'ACT-002',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          activityType: '電話',
          activityDateTime: '2024-01-12T14:00:00Z',
          activityContent: 'フォローアップ',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 30,
          activityCount: 1,
          activityFrequency: 'follow-up',
          activityResult: 'agreed',
          nextAction: null,
          createdAt: '2024-01-12',
          updatedAt: '2024-01-12',
          createdBy: 'REP-001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T10:30:00Z',
    });

    const mockFetchDealsForPeriod = dataPersistence.fetchDealsForPeriod as jest.Mock;
    mockFetchDealsForPeriod.mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          customerId: 'CUST-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'プロジェクトA',
          dealAmount: 500000,
          stageId: 'STAGE-003',
          expectedContractDate: '2024-01-25',
          contractedDate: '2024-01-15',
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
          createdBy: 'REP-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    });

    const mockFetchSalesTargets = dataPersistence.fetchSalesTargets as jest.Mock;
    mockFetchSalesTargets.mockResolvedValue({
      salesTargets: [
        {
          salesTargetId: 'TARGET-001',
          salesRepresentativeId: 'REP-001',
          customerId: null,
          targetYearMonth: '2024-01',
          targetAmount: 1000000,
          targetCount: 10,
          status: 'active',
          remarks: null,
          createdAt: '2023-12-01',
          createdBy: 'system',
          updatedAt: '2023-12-01',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
    mockFetchAllDealStages.mockResolvedValue({
      stages: [
        {
          stageId: 'STAGE-001',
          stageName: '初期接触',
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'STAGE-002',
          stageName: '提案',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'STAGE-003',
          stageName: '成約',
          stageOrder: 3,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 3,
      fetchedAt: '2024-01-15T10:30:00Z',
    });

    const mockFetchUserPermissions = dataPersistence.fetchUserPermissions as jest.Mock;
    mockFetchUserPermissions.mockResolvedValue({
      permissions: [
        {
          permissionId: 'PERM-001',
          userId: 'USER-001',
          permissionCode: 'dashboard:view',
          permissionName: 'ダッシュボード表示',
          description: null,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          permissionId: 'PERM-002',
          userId: 'USER-001',
          permissionCode: 'data:read',
          permissionName: 'データ読取',
          description: null,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T10:30:00Z',
    });
  });

  it('targetPeriod=2024-01、currentDate=2024-01-15T10:30:00Z、requestingUserId=USER-001 で呼び出し、正常な AggregateSalesPerformanceOutput が返される', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:30:00Z'),
      requestingUserId: 'USER-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2024-01');
    expect(result.aggregationTimestamp).toBeDefined();
    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(result.activityMetricsByRepresentative.length).toBeGreaterThan(0);
    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.anomalousMetrics).toBeDefined();
    expect(result.dataFreshnessStatus).toBeDefined();
  });

  it('営業太郎の活動実績が activityMetricsByRepresentative に 2 件として集計されること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:30:00Z'),
      requestingUserId: 'USER-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const tarouMetrics = result.activityMetricsByRepresentative.find(
      (m: any) => m.representativeId === 'REP-001'
    );
    expect(tarouMetrics).toBeDefined();
    expect(tarouMetrics.totalActivityCount).toBe(2);
  });

  it('成約ステージが dealStageProgressMetrics に 1 件・500000 円として集計されること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:30:00Z'),
      requestingUserId: 'USER-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const contractedStage = result.dealStageProgressMetrics.find(
      (m: any) => m.stageId === 'STAGE-003'
    );
    expect(contractedStage).toBeDefined();
    expect(contractedStage.totalDealCount).toBe(1);
    expect(contractedStage.totalDealAmount).toBe(500000);
  });

  it('coachingPriorityRanking に REP-001 の優先度スコアと理由が含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:30:00Z'),
      requestingUserId: 'USER-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.coachingPriorityRanking.length).toBeGreaterThan(0);
    const tarouRanking = result.coachingPriorityRanking.find(
      (r: any) => r.representativeId === 'REP-001'
    );
    expect(tarouRanking).toBeDefined();
    expect(tarouRanking.priorityScore).toBeDefined();
    expect(tarouRanking.scoringFactors).toBeDefined();
    expect(tarouRanking.recommendedAction).toBeDefined();
  });

  it('dataFreshnessStatus に鮮度判定結果が含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:30:00Z'),
      requestingUserId: 'USER-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toBeDefined();
    expect(result.dataFreshnessStatus.dataAgeMinutes).toBeDefined();
    expect(result.dataFreshnessStatus.freshnessThresholdMinutes).toBeDefined();
    expect(result.dataFreshnessStatus.isFresh).toBeDefined();
  });
});
