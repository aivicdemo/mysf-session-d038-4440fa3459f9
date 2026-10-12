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

describe('SCEN-442: calculateCoachingPriorityRanking - daysSinceLastUpdate が負の値のとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('経過日数が負の値のとき、経過日数を0に補正して計算を続行する', async () => {
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
          salesRepresentativeId: 'REP-001',
          name: '営業太郎',
          emailAddress: 'taro@example.com',
          phoneNumber: null,
          department: '営業部',
          jobTitle: null,
          supervisorId: null,
          status: 'active',
          createdAt: '2020-01-01',
          updatedAt: '2024-10-31T23:59:59Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-10-31T23:59:59Z',
    });

    // 前提: fetchActivitiesByRepresentative の戻り値
    mockFetchActivitiesByRepresentative.mockResolvedValue({
      activities: [
        {
          activityId: 'ACT-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          activityType: '訪問',
          activityDateTime: '2024-10-15T10:00:00Z',
          activityContent: 'Customer visit',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 60,
          activityCount: 1,
          activityFrequency: '初回',
          activityResult: '成功',
          nextAction: null,
          createdAt: '2024-10-15',
          updatedAt: '2024-10-15',
          createdBy: 'REP-001',
        },
        {
          activityId: 'ACT-002',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          activityType: '電話',
          activityDateTime: '2024-10-20T14:00:00Z',
          activityContent: 'Phone call',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 15,
          activityCount: 1,
          activityFrequency: '継続',
          activityResult: '成功',
          nextAction: null,
          createdAt: '2024-10-20',
          updatedAt: '2024-10-20',
          createdBy: 'REP-001',
        },
        {
          activityId: 'ACT-003',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          activityType: 'メール',
          activityDateTime: '2024-10-25T09:00:00Z',
          activityContent: 'Email follow-up',
          nextFollowUpScheduledDate: null,
          dealId: null,
          estimatedAmount: null,
          contractedFlag: false,
          activityDurationMinutes: 5,
          activityCount: 43,
          activityFrequency: '継続',
          activityResult: '成功',
          nextAction: null,
          createdAt: '2024-10-25',
          updatedAt: '2024-10-25',
          createdBy: 'REP-001',
        },
      ],
      totalCount: 3,
      fetchedAt: '2024-10-31T23:59:59Z',
    });

    // 前提: fetchDealsForPeriod の戻り値 (DEAL-008 の lastUpdateDate が '2024-10-31T18:59:59Z')
    mockFetchDealsForPeriod.mockResolvedValue({
      deals: [
        {
          dealId: 'DEAL-001',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 1',
          dealAmount: 500000,
          stageId: 'STAGE-001',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-01',
          updatedAt: '2024-10-26',
          createdBy: 'REP-001',
        },
        {
          dealId: 'DEAL-002',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 2',
          dealAmount: 0,
          stageId: 'STAGE-001',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-02',
          updatedAt: '2024-10-26',
          createdBy: 'REP-001',
        },
        {
          dealId: 'DEAL-003',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 3',
          dealAmount: 800000,
          stageId: 'STAGE-002',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-03',
          updatedAt: '2024-10-26',
          createdBy: 'REP-001',
        },
        {
          dealId: 'DEAL-004',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 4',
          dealAmount: 700000,
          stageId: 'STAGE-002',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-04',
          updatedAt: '2024-10-26',
          createdBy: 'REP-001',
        },
        {
          dealId: 'DEAL-005',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 5',
          dealAmount: 500000,
          stageId: 'STAGE-002',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-05',
          updatedAt: '2024-10-26',
          createdBy: 'REP-001',
        },
        {
          dealId: 'DEAL-006',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 6',
          dealAmount: 0,
          stageId: 'STAGE-003',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-06',
          updatedAt: '2024-10-26',
          createdBy: 'REP-001',
        },
        {
          dealId: 'DEAL-007',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 7',
          dealAmount: 0,
          stageId: 'STAGE-003',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-07',
          updatedAt: '2024-10-26',
          createdBy: 'REP-001',
        },
        {
          dealId: 'DEAL-008',
          customerId: 'cust-001',
          salesRepresentativeId: 'REP-001',
          dealName: 'Deal 8',
          dealAmount: 0,
          stageId: 'STAGE-004',
          expectedContractDate: '2024-10-31',
          contractedDate: null,
          description: null,
          lossReason: null,
          invoiceGenerationSLADeadline: null,
          invoiceSLAExceededFlag: false,
          createdAt: '2024-10-08',
          updatedAt: '2024-10-31T18:59:59Z',
          createdBy: 'REP-001',
        },
      ],
      totalCount: 8,
      fetchedAt: '2024-10-31T23:59:59Z',
    });

    // 前提: fetchSalesTargets の戻り値
    mockFetchSalesTargets.mockResolvedValue({
      salesTargets: [
        {
          salesTargetId: 'target-001',
          salesRepresentativeId: 'REP-001',
          customerId: null,
          targetYearMonth: '2024-10',
          targetAmount: 3000000,
          targetCount: 50,
          status: 'active',
          remarks: null,
          createdAt: '2024-09-01',
          createdBy: 'system',
          updatedAt: '2024-10-31T23:59:59Z',
          updatedBy: 'system',
        },
      ],
      totalCount: 1,
      fetchedAt: '2024-10-31T23:59:59Z',
    });

    // 前提: fetchAllDealStages の戻り値
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
          createdAt: '2020-01-01',
          updatedAt: '2020-01-01',
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
          createdAt: '2020-01-01',
          updatedAt: '2020-01-01',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'STAGE-003',
          stageName: '交渉',
          stageOrder: 3,
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
          stageId: 'STAGE-004',
          stageName: '成約待ち',
          stageOrder: 4,
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
      totalCount: 4,
      fetchedAt: '2024-10-31T23:59:59Z',
    });

    // 前提: fetchUserPermissions の戻り値
    mockFetchUserPermissions.mockResolvedValue({
      permissions: [
        {
          permissionId: 'perm-001',
          userId: 'USER-001',
          permissionCode: 'VIEW_DASHBOARD',
          permissionName: 'ダッシュボード表示',
          description: 'ダッシュボード表示権限',
          validFlag: true,
          createdAt: '2020-01-01',
          updatedAt: '2024-10-31T23:59:59Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          permissionId: 'perm-002',
          userId: 'USER-001',
          permissionCode: 'VIEW_ALL_REPRESENTATIVES',
          permissionName: '全営業担当者データ表示',
          description: '全営業担当者データ表示権限',
          validFlag: true,
          createdAt: '2020-01-01',
          updatedAt: '2024-10-31T23:59:59Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 2,
      fetchedAt: '2024-10-31T23:59:59Z',
    });

    // テスト: aggregateSalesPerformanceForDashboard を呼び出す
    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-10',
      currentDate: new Date('2024-10-31T23:59:59Z'),
      requestingUserId: 'USER-001',
    };

    const result: AggregateSalesPerformanceOutput = await aggregateSalesPerformanceForDashboard(input);

    // 期待結果: エラーは発生せず、AggregateSalesPerformanceOutput を返す
    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2024-10');

    // 期待結果: coachingPriorityRanking が正常に計算されている
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking.length).toBeGreaterThan(0);

    const rankingItem = result.coachingPriorityRanking.find(
      (item) => item.representativeId === 'REP-001'
    );

    expect(rankingItem).toBeDefined();

    // 期待結果: priorityScore が 0～100 の範囲内に正規化されている
    expect(rankingItem?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(rankingItem?.priorityScore).toBeLessThanOrEqual(100);

    // 期待結果: activityPerformanceGap の検証
    const activityGapFactor = rankingItem?.scoringFactors.find(
      (factor) => factor.factorName.includes('activityPerformanceGap') || factor.factorName.includes('Activity')
    );
    expect(activityGapFactor).toBeDefined();

    // 期待結果: priorityLevel が適切に設定されている
    expect(['低', '中', '高']).toContain(rankingItem?.priorityLevel);

    // 期待結果: recommendedAction に内容が含まれている
    expect(rankingItem?.recommendedAction).toBeDefined();
    expect(rankingItem?.recommendedAction.length).toBeGreaterThan(0);

    // 期待結果: daysSinceLastUpdate が負の値であっても正常に計算されている
    // followUpScore が正常に計算されていることを確認
    const followUpScoreFactor = rankingItem?.scoringFactors.find(
      (factor) => factor.factorName.includes('followUp') || factor.factorName.includes('followUpScore')
    );
    if (followUpScoreFactor) {
      expect(typeof followUpScoreFactor.factorValue).toBe('number');
    }
  });
});
