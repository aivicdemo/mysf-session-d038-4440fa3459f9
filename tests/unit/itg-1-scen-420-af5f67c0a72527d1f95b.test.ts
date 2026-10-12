import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-420: aggregateSalesPerformanceForDashboard - normal case with single sales rep and multiple data points', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate valid aggregated output with all expected fields', async () => {
    const targetPeriod = '2024-01';
    const currentDate = new Date('2024-01-15T10:30:00Z');
    const requestingUserId = 'USER-001';

    const mockSalesReps = {
      salesRepresentatives: [
        { salesRepresentativeId: 'REP-001', name: '営業太郎', department: '営業部', emailAddress: 'taro@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockActivities = {
      activities: [
        { activityId: 'ACT-001', customerId: 'cust-001', salesRepresentativeId: 'REP-001', activityType: '訪問', activityDateTime: '2024-01-10T09:00:00Z', activityContent: 'visit', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 60, activityCount: 1, activityFrequency: 'initial', activityResult: 'success', nextAction: null, createdAt: '2024-01-10', updatedAt: '2024-01-10', createdBy: 'REP-001' },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockDeals = {
      deals: [
        { dealId: 'DEAL-20240115-001', customerId: 'CUST-001', salesRepresentativeId: 'REP-001', dealName: 'Deal 1', dealAmount: 500000, stageId: 'STAGE-002', expectedContractDate: '2024-01-30', contractedDate: null, description: null, lossReason: null, invoiceGenerationSLADeadline: null, invoiceSLAExceededFlag: false, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z', createdBy: 'REP-001' },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockTargets = {
      salesTargets: [
        { salesTargetId: 'target-001', salesRepresentativeId: 'REP-001', customerId: null, targetYearMonth: '2024-01', targetAmount: 1000000, targetCount: 10, status: 'active', remarks: null, createdAt: '2024-01-01', createdBy: 'admin', updatedAt: '2024-01-01', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2024-01-15T10:30:00Z',
    };

    const mockStages = {
      stages: [
        { stageId: 'STAGE-001', stageName: '初期接触', stageOrder: 1, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-002', stageName: '提案', stageOrder: 2, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-003', stageName: '交渉', stageOrder: 3, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'STAGE-004', stageName: '成約', stageOrder: 4, description: null, contractedStageFlag: true, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
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

    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(Array.isArray(result.activityMetricsByRepresentative)).toBe(true);
    expect(result.activityMetricsByRepresentative.length).toBeGreaterThan(0);

    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(Array.isArray(result.dealStageProgressMetrics)).toBe(true);
    expect(result.dealStageProgressMetrics.length).toBeGreaterThan(0);

    expect(result.coachingPriorityRanking).toBeDefined();
    expect(Array.isArray(result.coachingPriorityRanking)).toBe(true);

    expect(result.anomalousMetrics).toBeDefined();
    expect(Array.isArray(result.anomalousMetrics)).toBe(true);

    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toBeInstanceOf(Date);
    expect(result.dataFreshnessStatus.isFresh).toBeDefined();
  });
});
