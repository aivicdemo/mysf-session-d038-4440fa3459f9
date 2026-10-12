import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-411: aggregateSalesPerformanceForDashboard - normal case with monthly cutoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate sales performance data for dashboard with correct monthly cutoff period', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-15T10:30:00Z');
    const requestingUserId = 'user-sales-manager-001';

    const mockSalesReps = {
      salesRepresentatives: [
        { salesRepresentativeId: 'rep-001', name: '営業太郎', department: '営業部', emailAddress: 'taro@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
        { salesRepresentativeId: 'rep-002', name: '営業花子', department: '営業部', emailAddress: 'hanako@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-15T10:30:00Z',
    };

    const mockActivities = {
      activities: [
        { activityId: 'act-001', customerId: 'cust-001', salesRepresentativeId: 'rep-001', activityType: '訪問', activityDateTime: '2024-10-15T09:00:00Z', activityContent: 'visit', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 60, activityCount: 1, activityFrequency: 'initial', activityResult: 'success', nextAction: null, createdAt: '2024-10-15', updatedAt: '2024-10-15', createdBy: 'rep-001' },
        { activityId: 'act-002', customerId: 'cust-002', salesRepresentativeId: 'rep-001', activityType: '電話', activityDateTime: '2024-11-10T14:30:00Z', activityContent: 'call', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 30, activityCount: 1, activityFrequency: 'follow-up', activityResult: 'success', nextAction: null, createdAt: '2024-11-10', updatedAt: '2024-11-10', createdBy: 'rep-001' },
        { activityId: 'act-003', customerId: 'cust-003', salesRepresentativeId: 'rep-002', activityType: '訪問', activityDateTime: '2024-11-08T10:00:00Z', activityContent: 'visit', nextFollowUpScheduledDate: null, dealId: null, estimatedAmount: null, contractedFlag: false, activityDurationMinutes: 90, activityCount: 1, activityFrequency: 'initial', activityResult: 'success', nextAction: null, createdAt: '2024-11-08', updatedAt: '2024-11-08', createdBy: 'rep-002' },
      ],
      totalCount: 3,
      fetchedAt: '2024-11-15T10:30:00Z',
    };

    const mockDeals = {
      deals: [
        { dealId: 'deal-001', customerId: 'cust-001', salesRepresentativeId: 'rep-001', dealName: 'Deal 1', dealAmount: 1500000, stageId: 'stage-proposal', expectedContractDate: '2024-11-30', contractedDate: null, description: null, lossReason: null, invoiceGenerationSLADeadline: null, invoiceSLAExceededFlag: false, createdAt: '2024-11-05T08:00:00Z', updatedAt: '2024-11-05T08:00:00Z', createdBy: 'rep-001' },
        { dealId: 'deal-002', customerId: 'cust-002', salesRepresentativeId: 'rep-001', dealName: 'Deal 2', dealAmount: 800000, stageId: 'stage-negotiation', expectedContractDate: '2024-11-20', contractedDate: null, description: null, lossReason: null, invoiceGenerationSLADeadline: null, invoiceSLAExceededFlag: false, createdAt: '2024-11-03T08:00:00Z', updatedAt: '2024-11-03T08:00:00Z', createdBy: 'rep-001' },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-15T10:30:00Z',
    };

    const mockTargets = {
      salesTargets: [
        { salesTargetId: 'target-001', salesRepresentativeId: 'rep-001', customerId: null, targetYearMonth: '2024-11', targetAmount: 3000000, targetCount: 15, status: 'active', remarks: null, createdAt: '2024-11-01', createdBy: 'admin', updatedAt: '2024-11-01', updatedBy: 'admin' },
        { salesTargetId: 'target-002', salesRepresentativeId: 'rep-002', customerId: null, targetYearMonth: '2024-11', targetAmount: 3000000, targetCount: 15, status: 'active', remarks: null, createdAt: '2024-11-01', createdBy: 'admin', updatedAt: '2024-11-01', updatedBy: 'admin' },
      ],
      totalCount: 2,
      fetchedAt: '2024-11-15T10:30:00Z',
    };

    const mockStages = {
      stages: [
        { stageId: 'stage-initial', stageName: '初期接触', stageOrder: 1, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'stage-proposal', stageName: '提案', stageOrder: 2, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'stage-negotiation', stageName: '交渉', stageOrder: 3, description: null, contractedStageFlag: false, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
        { stageId: 'stage-closing', stageName: '成約待ち', stageOrder: 4, description: null, contractedStageFlag: true, lossStageFlag: false, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 4,
      fetchedAt: '2024-11-15T10:30:00Z',
    };

    const mockPermissions = {
      permissions: [
        { permissionId: 'perm-001', userId: 'user-sales-manager-001', permissionCode: 'DASHBOARD_VIEW', permissionName: 'ダッシュボード表示', description: null, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2024-11-15T10:30:00Z',
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
    expect(result.targetPeriod).toBe('2024-11');
    expect(result.aggregationTimestamp).toBeInstanceOf(Date);
    expect(result.aggregationTimestamp >= currentDate).toBe(true);

    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(Array.isArray(result.activityMetricsByRepresentative)).toBe(true);
    const rep001Activity = result.activityMetricsByRepresentative.find(m => m.representativeId === 'rep-001');
    expect(rep001Activity).toBeDefined();
    expect(rep001Activity!.totalActivityCount).toBe(2);
    const rep002Activity = result.activityMetricsByRepresentative.find(m => m.representativeId === 'rep-002');
    expect(rep002Activity).toBeDefined();
    expect(rep002Activity!.totalActivityCount).toBe(1);

    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(Array.isArray(result.dealStageProgressMetrics)).toBe(true);
    const proposalStage = result.dealStageProgressMetrics.find(m => m.stageId === 'stage-proposal');
    expect(proposalStage).toBeDefined();
    expect(proposalStage!.totalDealCount).toBe(1);
    expect(proposalStage!.totalDealAmount).toBe(1500000);
    const negotiationStage = result.dealStageProgressMetrics.find(m => m.stageId === 'stage-negotiation');
    expect(negotiationStage).toBeDefined();
    expect(negotiationStage!.totalDealCount).toBe(1);
    expect(negotiationStage!.totalDealAmount).toBe(800000);

    expect(result.coachingPriorityRanking).toBeDefined();
    expect(Array.isArray(result.coachingPriorityRanking)).toBe(true);

    expect(result.anomalousMetrics).toBeDefined();
    expect(Array.isArray(result.anomalousMetrics)).toBe(true);
    const rep001Anomalies = result.anomalousMetrics.filter(a => a.representativeId === 'rep-001');
    expect(rep001Anomalies.length).toBeGreaterThan(0);

    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.lastUpdateTimestamp).toBeInstanceOf(Date);
  });
});
