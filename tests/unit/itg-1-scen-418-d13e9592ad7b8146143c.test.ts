import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-418: aggregateSalesPerformanceForDashboard - normal aggregation with full setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully aggregate sales performance data', async () => {
    const targetPeriod = '2024-01';
    const currentDate = new Date('2024-01-31T23:59:59Z');
    const requestingUserId = 'USER-001';

    const mockAllSalesRepresentatives = {
      salesRepresentatives: [
        { salesRepresentativeId: 'REP-001', name: '営業太郎', department: '営業部', emailAddress: 'taro@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
        { salesRepresentativeId: 'REP-002', name: '営業花子', department: '営業部', emailAddress: 'hanako@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-31T23:59:59Z',
    };

    const mockActivitiesByRepresentative = {
      activities: [
        { activityId: 'ACT-001', customerId: 'cust-001', salesRepresentativeId: 'REP-001', activityType: '訪問', activityDateTime: '2024-01-15T10:00:00Z', activityContent: 'visit', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 60, activityCount: 1, activityFrequency: 'initial', activityResult: 'success', nextAction: null, createdAt: '2024-01-15', updatedAt: '2024-01-15', createdBy: 'REP-001' },
        { activityId: 'ACT-002', customerId: 'cust-002', salesRepresentativeId: 'REP-001', activityType: '電話', activityDateTime: '2024-01-20T14:00:00Z', activityContent: 'call', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 30, activityCount: 1, activityFrequency: 'follow-up', activityResult: 'success', nextAction: null, createdAt: '2024-01-20', updatedAt: '2024-01-20', createdBy: 'REP-001' },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-31T23:59:59Z',
    };

    const mockDealsByRepresentative = {
      deals: [
        { dealId: 'DEAL-001', customerId: 'CUST-001', salesRepresentativeId: 'REP-001', dealName: 'Deal 1', dealAmount: 500000, stageId: 'STAGE-002', expectedContractDate: '2024-01-30', contractedDate: null, description: null, lossReason: null, invoiceGenerationSLADeadline: null, invoiceSLAExceededFlag: false, createdAt: '2024-01-15', updatedAt: '2024-01-15', createdBy: 'REP-001' },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T23:59:59Z',
    };

    const mockSalesTargetsByRepresentative = {
      salesTargets: [
        { salesTargetId: 'target-001', salesRepresentativeId: 'REP-001', customerId: null, targetYearMonth: '2024-01', targetAmount: 1000000, targetCount: 10, status: 'active', remarks: null, createdAt: '2024-01-01', createdBy: 'admin', updatedAt: '2024-01-01', updatedBy: 'admin' },
        { salesTargetId: 'target-002', salesRepresentativeId: 'REP-002', customerId: null, targetYearMonth: '2024-01', targetAmount: 1000000, targetCount: 10, status: 'active', remarks: null, createdAt: '2024-01-01', createdBy: 'admin', updatedAt: '2024-01-01', updatedBy: 'admin' },
      ],
      totalCount: 2,
      fetchedAt: '2024-01-31T23:59:59Z',
    };

    const mockDealStages = {
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触', stageOrder: 1, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-002', stageName: '提案', stageOrder: 2, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-003', stageName: '交渉', stageOrder: 3, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-004', stageName: '成約', stageOrder: 4, description: null, contractedStageFlag: true, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 4,
      fetchedAt: '2024-01-31T23:59:59Z',
    };

    const mockUserPermissions = {
      permissions: [
        { permissionId: 'perm-001', userId: 'USER-001', permissionCode: 'DASHBOARD_VIEW', permissionName: 'ダッシュボード表示', description: null, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-31T23:59:59Z',
    };

    jest.mocked(dataPersistence.fetchAllSalesRepresentatives).mockResolvedValue(
      mockAllSalesRepresentatives
    );
    jest.mocked(dataPersistence.fetchActivitiesByRepresentative).mockResolvedValue(
      mockActivitiesByRepresentative
    );
    jest.mocked(dataPersistence.fetchDealsForPeriod).mockResolvedValue(
      mockDealsByRepresentative
    );
    jest.mocked(dataPersistence.fetchSalesTargets).mockResolvedValue(
      mockSalesTargetsByRepresentative
    );
    jest.mocked(dataPersistence.fetchAllDealStages).mockResolvedValue(mockDealStages);
    jest.mocked(dataPersistence.fetchUserPermissions).mockResolvedValue(mockUserPermissions);

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2024-01');
    expect(result.aggregationTimestamp).toBeInstanceOf(Date);
    expect(result.aggregationTimestamp.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());

    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(Array.isArray(result.activityMetricsByRepresentative)).toBe(true);
    const rep001Metric = result.activityMetricsByRepresentative.find(m => m.representativeId === 'REP-001');
    expect(rep001Metric).toBeDefined();
    expect(rep001Metric!.totalActivityCount).toBe(2);

    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(Array.isArray(result.dealStageProgressMetrics)).toBe(true);
    const proposalMetric = result.dealStageProgressMetrics.find(m => m.stageName === '提案');
    expect(proposalMetric).toBeDefined();
    expect(proposalMetric!.totalDealCount).toBe(1);
    expect(proposalMetric!.totalDealAmount).toBe(500000);

    expect(result.coachingPriorityRanking).toBeDefined();
    expect(Array.isArray(result.coachingPriorityRanking)).toBe(true);

    expect(result.anomalousMetrics).toBeDefined();
    expect(Array.isArray(result.anomalousMetrics)).toBe(true);

    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toBeInstanceOf(Date);
  });
});
