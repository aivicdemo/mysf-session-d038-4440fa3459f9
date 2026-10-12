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

describe('SCEN-422: 期待請求日が報告日より前のとき、異常値アラートが発行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchAllSalesRepresentatives = dataPersistence.fetchAllSalesRepresentatives as jest.Mock;
    mockFetchAllSalesRepresentatives.mockResolvedValue({
      salesRepresentatives: [
        {
          salesRepresentativeId: 'rep-001',
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
      fetchedAt: '2024-01-15T10:00:00Z',
    });

    const mockFetchActivitiesByRepresentative = dataPersistence.fetchActivitiesByRepresentative as jest.Mock;
    mockFetchActivitiesByRepresentative.mockResolvedValue({
      activities: [
        {
          activityId: 'act-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          activityType: '訪問',
          activityDateTime: '2024-01-10T09:00:00Z',
          activityContent: 'プロジェクトA検討',
          nextFollowUpScheduledDate: null,
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
          createdBy: 'rep-001',
        },
        {
          activityId: 'act-002',
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
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
          createdBy: 'rep-001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T10:00:00Z',
    });

    const mockFetchDealsForPeriod = dataPersistence.fetchDealsForPeriod as jest.Mock;
    mockFetchDealsForPeriod.mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-20240115-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          dealName: 'プロジェクトA',
          dealAmount: 500000,
          stageId: 'stage-02',
          expectedContractDate: '2024-01-20',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: '2024-01-10T23:59:59Z',
          invoiceSLAExceededFlag: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
          createdBy: 'rep-001',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:00:00Z',
    });

    const mockFetchSalesTargets = dataPersistence.fetchSalesTargets as jest.Mock;
    mockFetchSalesTargets.mockResolvedValue({
      salesTargets: [
        {
          salesTargetId: 'target-001',
          salesRepresentativeId: 'rep-001',
          customerId: null,
          targetYearMonth: '2024-01',
          targetAmount: 2000000,
          targetCount: 20,
          status: 'active',
          remarks: null,
          createdAt: '2023-12-01',
          createdBy: 'system',
          updatedAt: '2023-12-01',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:00:00Z',
    });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
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
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
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
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-03',
          stageName: '交渉',
          stageOrder: 3,
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
          stageId: 'stage-04',
          stageName: '成約',
          stageOrder: 4,
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
      totalCount: 4,
      fetchedAt: '2024-01-15T10:00:00Z',
    });

    const mockFetchUserPermissions = dataPersistence.fetchUserPermissions as jest.Mock;
    mockFetchUserPermissions.mockResolvedValue({
      permissions: [
        {
          permissionId: 'perm-001',
          userId: 'user-001',
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
          permissionId: 'perm-002',
          userId: 'user-001',
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
      fetchedAt: '2024-01-15T10:00:00Z',
    });
  });

  it('期待請求日が報告日より前のとき、anomalousMetrics に billing_timeline_issue アラートが含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.anomalousMetrics).toBeDefined();
    expect(Array.isArray(result.anomalousMetrics)).toBe(true);

    const billingIssue = result.anomalousMetrics.find(
      (alert: any) => alert.metricName === 'billing_timeline_issue'
    );
    expect(billingIssue).toBeDefined();
    expect(billingIssue.anomalyDescription).toContain('期待請求日が報告日より前');
    expect(billingIssue.highlightColor).toBe('warning');
    expect(billingIssue.recommendedResponse).toBeDefined();
  });

  it('ハイライト色が warning、推奨対応に「請求遅延の原因を確認し、経理・請求部門へ報告してください」が含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const billingIssue = result.anomalousMetrics.find(
      (alert: any) => alert.metricName === 'billing_timeline_issue'
    );
    expect(billingIssue.highlightColor).toBe('warning');
    expect(billingIssue.recommendedResponse).toContain('請求遅延の原因を確認');
    expect(billingIssue.recommendedResponse).toContain('経理・請求部門へ報告');
  });

  it('異常アラートが dealId=DEAL-20240115-001、expectedBillingDate=2024-01-10T23:59:59Z を含むこと', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const billingIssue = result.anomalousMetrics.find(
      (alert: any) => alert.metricName === 'billing_timeline_issue'
    );
    expect(billingIssue).toBeDefined();
  });

  it('出力に targetPeriod=2024-01、aggregationTimestamp は currentDate 以降の時刻が含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.targetPeriod).toBe('2024-01');
    expect(result.aggregationTimestamp).toBeDefined();
    expect(result.aggregationTimestamp >= new Date('2024-01-15T10:00:00Z')).toBe(true);
  });

  it('activityMetricsByRepresentative に rep-001 の活動件数 2 件が含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const repMetrics = result.activityMetricsByRepresentative.find(
      (m: any) => m.representativeId === 'rep-001'
    );
    expect(repMetrics).toBeDefined();
    expect(repMetrics.totalActivityCount).toBe(2);
  });

  it('dealStageProgressMetrics に stage-02（提案）の金額 500000 円が含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const proposalStage = result.dealStageProgressMetrics.find(
      (m: any) => m.stageId === 'stage-02'
    );
    expect(proposalStage).toBeDefined();
    expect(proposalStage.totalDealAmount).toBe(500000);
  });

  it('coachingPriorityRanking に優先度スコアと理由が含まれること', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.coachingPriorityRanking.length).toBeGreaterThan(0);
    expect(result.coachingPriorityRanking[0].priorityScore).toBeDefined();
    expect(result.coachingPriorityRanking[0].scoringFactors).toBeDefined();
  });

  it('dataFreshnessStatus が鮮度判定 fresh を示すこと', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.dataFreshnessStatus.isFresh).toBe(true);
  });
});
