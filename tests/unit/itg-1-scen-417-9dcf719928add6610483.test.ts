import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-417: aggregateSalesPerformanceForDashboard - normal case with detailed metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate comprehensive sales performance data with correct aggregation', async () => {
    const targetPeriod = '2024-01';
    const currentDate = new Date('2024-01-15T10:30:00Z');
    const requestingUserId = 'USER-001';

    const mockSalesReps = {
      salesRepresentatives: [
        { salesRepresentativeId: 'REP-001', name: '営業太郎', department: '営業部', emailAddress: 'taro@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
        { salesRepresentativeId: 'REP-002', name: '営業花子', department: '営業部', emailAddress: 'hanako@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockActivities = {
      activities: [
        { activityId: 'ACT-001', customerId: 'cust-001', salesRepresentativeId: 'REP-001', activityType: '訪問', activityDateTime: '2024-01-10T00:00:00Z', activityContent: 'visit', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 60, activityCount: 1, activityFrequency: 'initial', activityResult: 'success', nextAction: null, createdAt: '2024-01-10', updatedAt: '2024-01-10', createdBy: 'REP-001' },
        { activityId: 'ACT-002', customerId: 'cust-002', salesRepresentativeId: 'REP-001', activityType: '電話', activityDateTime: '2024-01-12T00:00:00Z', activityContent: 'call', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 30, activityCount: 1, activityFrequency: 'follow-up', activityResult: 'success', nextAction: null, createdAt: '2024-01-12', updatedAt: '2024-01-12', createdBy: 'REP-001' },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockDeals = {
      deals: [
        { dealId: 'DEAL-001', customerId: 'cust-001', salesRepresentativeId: 'REP-001', dealName: 'Deal 1', dealAmount: 500000, stageId: 'STAGE-002', expectedContractDate: '2024-01-30', contractedDate: null, description: null, lossReason: null, invoiceGenerationSLADeadline: null, invoiceSLAExceededFlag: false, createdAt: '2024-01-10', updatedAt: '2024-01-10', createdBy: 'REP-001' },
        { dealId: 'DEAL-002', customerId: 'cust-002', salesRepresentativeId: 'REP-001', dealName: 'Deal 2', dealAmount: 300000, stageId: 'STAGE-003', expectedContractDate: '2024-01-20', contractedDate: null, description: null, lossReason: null, invoiceGenerationSLADeadline: null, invoiceSLAExceededFlag: false, createdAt: '2024-01-08', updatedAt: '2024-01-08', createdBy: 'REP-001' },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockTargets = {
      salesTargets: [
        { salesTargetId: 'target-001', salesRepresentativeId: 'REP-001', customerId: null, targetYearMonth: '2024-01', targetAmount: 1000000, targetCount: 10, status: 'active', remarks: null, createdAt: '2024-01-01', createdBy: 'admin', updatedAt: '2024-01-01', updatedBy: 'admin' },
        { salesTargetId: 'target-002', salesRepresentativeId: 'REP-002', customerId: null, targetYearMonth: '2024-01', targetAmount: 1000000, targetCount: 10, status: 'active', remarks: null, createdAt: '2024-01-01', createdBy: 'admin', updatedAt: '2024-01-01', updatedBy: 'admin' },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockStages = {
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触', stageOrder: 1, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-002', stageName: '提案', stageOrder: 2, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-003', stageName: '交渉', stageOrder: 3, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-004', stageName: '成約待ち', stageOrder: 4, description: null, contractedStageFlag: true, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 4,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockPermissions = {
      permissions: [
        { permissionId: 'perm-001', userId: 'USER-001', permissionCode: 'DASHBOARD_VIEW', permissionName: 'ダッシュボード表示', description: null, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    jest.mocked(dataPersistence.fetchAllSalesRepresentatives).mockResolvedValue(mockSalesReps);
    jest.mocked(dataPersistence.fetchActivitiesByRepresentative).mockResolvedValue(mockActivities);
    jest.mocked(dataPersistence.fetchDealsForPeriod).mockResolvedValue(mockDeals);
    jest.mocked(dataPersistence.fetchSalesTargets).mockResolvedValue(mockTargets);
    jest.mocked(dataPersistence.fetchAllDealStages).mockResolvedValue(mockStages);
    jest.mocked(dataPersistence.fetchUserPermissions).mockResolvedValue(mockPermissions);

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2024-01');
    expect(result.aggregationTimestamp).toBeInstanceOf(Date);
    expect(result.aggregationTimestamp.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());

    // Verify activity metrics
    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(Array.isArray(result.activityMetricsByRepresentative)).toBe(true);
    const rep001Activity = result.activityMetricsByRepresentative.find(
      m => m.representativeId === 'REP-001'
    );
    expect(rep001Activity).toBeDefined();
    expect(rep001Activity!.totalActivityCount).toBe(2);
    expect(rep001Activity!.targetActivityCount).toBe(10);
    expect(rep001Activity!.achievementPercentage).toBe(20);
    expect(rep001Activity!.isAnomalous).toBe(true);

    const rep002Activity = result.activityMetricsByRepresentative.find(
      m => m.representativeId === 'REP-002'
    );
    expect(rep002Activity).toBeDefined();
    expect(rep002Activity!.totalActivityCount).toBe(0);

    // Verify deal stage progress metrics
    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(Array.isArray(result.dealStageProgressMetrics)).toBe(true);
    const proposalStage = result.dealStageProgressMetrics.find(m => m.stageId === 'STAGE-002' || m.stageName === '提案');
    expect(proposalStage).toBeDefined();
    expect(proposalStage!.totalDealCount).toBe(1);
    expect(proposalStage!.totalDealAmount).toBe(500000);

    const negotiationStage = result.dealStageProgressMetrics.find(m => m.stageId === 'STAGE-003' || m.stageName === '交渉');
    expect(negotiationStage).toBeDefined();
    expect(negotiationStage!.totalDealCount).toBe(1);
    expect(negotiationStage!.totalDealAmount).toBe(300000);

    // Verify coaching priority ranking
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(Array.isArray(result.coachingPriorityRanking)).toBe(true);
    expect(result.coachingPriorityRanking.length).toBeGreaterThan(0);
    const rep001Ranking = result.coachingPriorityRanking.find(r => r.representativeId === 'REP-001');
    expect(rep001Ranking).toBeDefined();
    expect(rep001Ranking!.rank).toBe(1);
    expect(rep001Ranking!.priorityScore).toBeGreaterThan(0);
    expect(rep001Ranking!.recommendedAction).toBeDefined();

    // Verify anomalous metrics
    expect(result.anomalousMetrics).toBeDefined();
    expect(Array.isArray(result.anomalousMetrics)).toBe(true);
    const activityAnomalies = result.anomalousMetrics.filter(
      a => a.metricName === 'REP-001の活動件数'
    );
    expect(activityAnomalies.length).toBeGreaterThan(0);
    const activityAnomaly = activityAnomalies[0];
    expect(activityAnomaly.anomalyDescription).toContain('目標10件');
    expect(activityAnomaly.anomalyDescription).toContain('実績2件');

    // Verify data freshness
    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toBeInstanceOf(Date);
  });
});
