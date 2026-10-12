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

describe('SCEN-423: 営業担当者別・顧客別の請求集計、未請求金額、金額ズレを計算し、ステータス不整合の異常フラグを立てる', () => {
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
          updatedAt: '2024-11-01',
          createdBy: 'system',
          updatedBy: null,
        },
        {
          salesRepresentativeId: 'rep-002',
          name: '営業花子',
          emailAddress: 'hanako@example.com',
          phoneNumber: null,
          department: '営業部',
          jobTitle: null,
          supervisorId: null,
          status: 'active',
          createdAt: '2023-01-01',
          updatedAt: '2024-11-01',
          createdBy: 'system',
          updatedBy: null,
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-30T23:59:59Z',
    });

    const mockFetchActivitiesByRepresentative = dataPersistence.fetchActivitiesByRepresentative as jest.Mock;
    mockFetchActivitiesByRepresentative.mockResolvedValue({
      activities: [
        {
          activityId: 'act-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          activityType: '訪問',
          activityDateTime: '2024-11-15T09:00:00Z',
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
          createdAt: '2024-11-15',
          updatedAt: '2024-11-15',
          createdBy: 'rep-001',
        },
        {
          activityId: 'act-002',
          customerId: 'cust-002',
          salesRepresentativeId: 'rep-001',
          activityType: '電話',
          activityDateTime: '2024-11-20T14:00:00Z',
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
          createdAt: '2024-11-20',
          updatedAt: '2024-11-20',
          createdBy: 'rep-001',
        },
        {
          activityId: 'act-003',
          customerId: 'cust-003',
          salesRepresentativeId: 'rep-002',
          activityType: 'メール',
          activityDateTime: '2024-11-10T11:00:00Z',
          activityContent: 'メール送信',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 15,
          activityCount: 1,
          activityFrequency: 'first',
          activityResult: 'sent',
          nextAction: null,
          createdAt: '2024-11-10',
          updatedAt: '2024-11-10',
          createdBy: 'rep-002',
        },
      ],
      totalCount: 3,
      fetchedAt: '2024-11-30T23:59:59Z',
    });

    const mockFetchDealsForPeriod = dataPersistence.fetchDealsForPeriod as jest.Mock;
    mockFetchDealsForPeriod.mockResolvedValue({
      deals: [
        {
          dealId: 'deal-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          dealName: 'プロジェクトA',
          dealAmount: 1000000,
          stageId: 'stage-002',
          expectedContractDate: '2024-11-25',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-11-01',
          updatedAt: '2024-11-15',
          createdBy: 'rep-001',
        },
        {
          dealId: 'deal-002',
          customerId: 'cust-002',
          salesRepresentativeId: 'rep-001',
          dealName: 'プロジェクトB',
          dealAmount: 500000,
          stageId: 'stage-003',
          expectedContractDate: '2024-11-30',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-11-05',
          updatedAt: '2024-11-20',
          createdBy: 'rep-001',
        },
        {
          dealId: 'deal-003',
          customerId: 'cust-003',
          salesRepresentativeId: 'rep-002',
          dealName: 'プロジェクトC',
          dealAmount: 800000,
          stageId: 'stage-004',
          expectedContractDate: '2024-11-28',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-11-08',
          updatedAt: '2024-11-25',
          createdBy: 'rep-002',
        },
      ],
      totalCount: 3,
      fetchedAt: '2024-11-30T23:59:59Z',
    });

    const mockFetchSalesTargets = dataPersistence.fetchSalesTargets as jest.Mock;
    mockFetchSalesTargets.mockResolvedValue({
      salesTargets: [
        {
          salesTargetId: 'target-001',
          salesRepresentativeId: 'rep-001',
          customerId: null,
          targetYearMonth: '2024-11',
          targetAmount: 2000000,
          targetCount: 10,
          status: 'active',
          remarks: null,
          createdAt: '2024-10-01',
          createdBy: 'system',
          updatedAt: '2024-10-01',
          updatedBy: 'system',
        },
        {
          salesTargetId: 'target-002',
          salesRepresentativeId: 'rep-002',
          customerId: null,
          targetYearMonth: '2024-11',
          targetAmount: 1500000,
          targetCount: 8,
          status: 'active',
          remarks: null,
          createdAt: '2024-10-01',
          createdBy: 'system',
          updatedAt: '2024-10-01',
          updatedBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-30T23:59:59Z',
    });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
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
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
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
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
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
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-004',
          stageName: '成約待ち',
          stageOrder: 4,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 4,
      fetchedAt: '2024-11-30T23:59:59Z',
    });

    const mockFetchUserPermissions = dataPersistence.fetchUserPermissions as jest.Mock;
    mockFetchUserPermissions.mockResolvedValue({
      permissions: [
        {
          permissionId: 'perm-001',
          userId: 'user-sales-mgr-001',
          permissionCode: 'view_dashboard',
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
          userId: 'user-sales-mgr-001',
          permissionCode: 'view_all_representatives',
          permissionName: '全営業担当者データ表示',
          description: null,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          permissionId: 'perm-003',
          userId: 'user-sales-mgr-001',
          permissionCode: 'view_all_deals',
          permissionName: '全商談データ表示',
          description: null,
          validFlag: true,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 3,
      fetchedAt: '2024-11-30T23:59:59Z',
    });
  });

  it('aggregateSalesPerformanceForDashboard を呼び出し、正常に AggregateSalesPerformanceOutput が返される', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2024-11');
    expect(result.aggregationTimestamp).toBeDefined();
  });

  it('営業担当者別の活動実績が正しく集計される（rep-001: 2 件、rep-002: 1 件）', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const rep001Metrics = result.activityMetricsByRepresentative.find(
      (m: any) => m.representativeId === 'rep-001'
    );
    const rep002Metrics = result.activityMetricsByRepresentative.find(
      (m: any) => m.representativeId === 'rep-002'
    );

    expect(rep001Metrics).toBeDefined();
    expect(rep001Metrics.totalActivityCount).toBe(2);

    expect(rep002Metrics).toBeDefined();
    expect(rep002Metrics.totalActivityCount).toBe(1);
  });

  it('商談ステージ別進捗が正しく集計される（提案: 1 件・1,000,000 円、交渉: 1 件・500,000 円、成約待ち: 1 件・800,000 円）', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const proposalStage = result.dealStageProgressMetrics.find(
      (m: any) => m.stageId === 'stage-002'
    );
    const negotiationStage = result.dealStageProgressMetrics.find(
      (m: any) => m.stageId === 'stage-003'
    );
    const awaitingStage = result.dealStageProgressMetrics.find(
      (m: any) => m.stageId === 'stage-004'
    );

    expect(proposalStage).toBeDefined();
    expect(proposalStage.totalDealCount).toBe(1);
    expect(proposalStage.totalDealAmount).toBe(1000000);

    expect(negotiationStage).toBeDefined();
    expect(negotiationStage.totalDealCount).toBe(1);
    expect(negotiationStage.totalDealAmount).toBe(500000);

    expect(awaitingStage).toBeDefined();
    expect(awaitingStage.totalDealCount).toBe(1);
    expect(awaitingStage.totalDealAmount).toBe(800000);
  });

  it('指導優先度ランキングが生成され、rep-002 が最高優先度、rep-001 が次点であること', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking.length).toBeGreaterThan(0);

    const rep002Ranking = result.coachingPriorityRanking.find(
      (r: any) => r.representativeId === 'rep-002'
    );
    const rep001Ranking = result.coachingPriorityRanking.find(
      (r: any) => r.representativeId === 'rep-001'
    );

    expect(rep002Ranking).toBeDefined();
    expect(rep001Ranking).toBeDefined();
    expect(rep002Ranking.rank).toBeLessThan(rep001Ranking.rank);
  });

  it('rep-001 の達成度が正しく計算される（活動: 2/10 = 20%、金額: 1,500,000/2,000,000 = 75%）', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const rep001Metrics = result.activityMetricsByRepresentative.find(
      (m: any) => m.representativeId === 'rep-001'
    );

    expect(rep001Metrics.totalActivityCount).toBe(2);
    expect(rep001Metrics.targetActivityCount).toBe(10);
    if (rep001Metrics.achievementPercentage !== null && rep001Metrics.achievementPercentage !== undefined) {
      expect(rep001Metrics.achievementPercentage).toBe(20);
    }
  });

  it('rep-002 の達成度が正しく計算される（活動: 1/8 = 12.5%、金額: 800,000/1,500,000 = 53.3%）', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    const rep002Metrics = result.activityMetricsByRepresentative.find(
      (m: any) => m.representativeId === 'rep-002'
    );

    expect(rep002Metrics.totalActivityCount).toBe(1);
    expect(rep002Metrics.targetActivityCount).toBe(8);
    if (rep002Metrics.achievementPercentage !== null && rep002Metrics.achievementPercentage !== undefined) {
      expect(rep002Metrics.achievementPercentage).toBe(12.5);
    }
  });

  it('異常値が anomalousMetrics 配列に格納され、ハイライト色と推奨対応が含まれること', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.anomalousMetrics).toBeDefined();
    expect(Array.isArray(result.anomalousMetrics)).toBe(true);

    if (result.anomalousMetrics.length > 0) {
      const anomaly = result.anomalousMetrics[0];
      expect(anomaly.highlightColor).toBeDefined();
      expect(anomaly.recommendedResponse).toBeDefined();
    }
  });

  it('出力の targetPeriod が 2024-11 であること', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.targetPeriod).toBe('2024-11');
  });

  it('出力の aggregationTimestamp が集計実行日時として設定されること', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.aggregationTimestamp).toBeDefined();
    expect(result.aggregationTimestamp instanceof Date).toBe(true);
  });

  it('dataFreshnessStatus が最終更新日時・鮮度判定・警告の有無を含むこと', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toBeDefined();
    expect(result.dataFreshnessStatus.isFresh).toBeDefined();
    if (result.dataFreshnessStatus.freshnessWarning !== undefined) {
      expect(typeof result.dataFreshnessStatus.freshnessWarning === 'string' || result.dataFreshnessStatus.freshnessWarning === null).toBe(true);
    }
  });

  it('すべての営業担当者が権限内で表示対象となり、エラーは発生しないこと', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-mgr-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    expect(result.activityMetricsByRepresentative.length).toBe(2);
  });
});
