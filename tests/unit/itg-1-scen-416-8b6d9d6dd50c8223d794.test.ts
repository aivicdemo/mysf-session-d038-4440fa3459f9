import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-416: aggregateSalesPerformanceForDashboard - warning when access date is in the past', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include warning message when access date is in the past', async () => {
    const targetPeriod = '2024-01';
    const currentDate = new Date('2023-12-15T10:00:00Z');
    const requestingUserId = 'user-001';

    const mockSalesReps = {
      salesRepresentatives: [
        { salesRepresentativeId: 'rep-001', name: '山田太郎', department: 'dept-sales-01', emailAddress: 'taro@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
      ],
      totalCount: 1,
      fetchedAt: '2023-12-15T10:00:00Z',
    };

    const mockActivities = {
      activities: [
        { activityId: 'act-001', customerId: 'cust-001', salesRepresentativeId: 'rep-001', activityType: 'visit', activityDateTime: '2024-01-15T00:00:00Z', activityContent: 'visit activity', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 60, activityCount: 1, activityFrequency: 'initial', activityResult: 'success', nextAction: null, createdAt: '2024-01-15', updatedAt: '2024-01-15', createdBy: 'rep-001' },
      ],
      totalCount: 1,
      fetchedAt: '2023-12-15T10:00:00Z',
    };

    const mockDeals = {
      deals: [
        { dealId: 'deal-001', customerId: 'cust-001', salesRepresentativeId: 'rep-001', dealName: 'Deal 1', dealAmount: 500000, stageId: 'stage-proposal', expectedContractDate: '2024-01-20', contractedDate: null, description: null, lossReason: null, invoiceGenerationSLADeadline: null, invoiceSLAExceededFlag: false, createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z', createdBy: 'rep-001' },
      ],
      totalCount: 1,
      fetchedAt: '2023-12-15T10:00:00Z',
    };

    const mockTargets = {
      salesTargets: [
        { salesTargetId: 'target-001', salesRepresentativeId: 'rep-001', customerId: null, targetYearMonth: '2024-01', targetAmount: 1000000, targetCount: 20, status: 'active', remarks: null, createdAt: '2024-01-01', createdBy: 'admin', updatedAt: '2024-01-01', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2023-12-15T10:00:00Z',
    };

    const mockStages = {
      stages: [
        { stageId: 'stage-initial', stageName: '初期接触', stageOrder: 1, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'stage-proposal', stageName: '提案', stageOrder: 2, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'stage-negotiation', stageName: '交渉', stageOrder: 3, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'stage-won', stageName: '成約', stageOrder: 4, description: null, contractedStageFlag: true, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 4,
      fetchedAt: '2023-12-15T10:00:00Z',
    };

    const mockPermissions = {
      permissions: [
        { permissionId: 'perm-001', userId: 'user-001', permissionCode: 'DASHBOARD_VIEW', permissionName: 'ダッシュボード表示', description: null, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2023-12-15T10:00:00Z',
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
    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.freshnessWarning).toBe(
      '過去の日付でのアクセスです。集計対象期間が正しいか確認してください。'
    );

    // Verify that processing continues despite warning
    expect(result.aggregationTimestamp).toBeInstanceOf(Date);
    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(result.dealStageProgressMetrics).toBeDefined();
  });
});
