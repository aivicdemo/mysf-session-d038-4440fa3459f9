import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-443: activityMetricsByRepresentative aggregation', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate activity metrics by representative with correct achievement rates', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-15T10:30:00Z');
    const requestingUserId = 'user-sales-manager-001';

    // Setup mocks
    (mockDataPersistence.fetchAllSalesRepresentatives as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', rep_name: '営業太郎', department_id: 'dept-sales-01', is_active: true },
      { rep_id: 'rep-002', rep_name: '営業花子', department_id: 'dept-sales-01', is_active: true },
      { rep_id: 'rep-003', rep_name: '営業次郎', department_id: 'dept-sales-01', is_active: true },
    ]);

    (mockDataPersistence.fetchActivitiesByRepresentative as jest.Mock) = jest.fn().mockResolvedValue([
      { activity_id: 'act-001', rep_id: 'rep-001', activity_type: '訪問', activity_date: '2024-11-01', duration_minutes: 60 },
      { activity_id: 'act-002', rep_id: 'rep-001', activity_type: '電話', activity_date: '2024-11-02', duration_minutes: 15 },
      { activity_id: 'act-003', rep_id: 'rep-001', activity_type: 'メール', activity_date: '2024-11-03', duration_minutes: 5 },
      { activity_id: 'act-004', rep_id: 'rep-001', activity_type: '訪問', activity_date: '2024-11-05', duration_minutes: 90 },
      { activity_id: 'act-005', rep_id: 'rep-002', activity_type: '訪問', activity_date: '2024-11-01', duration_minutes: 60 },
      { activity_id: 'act-006', rep_id: 'rep-002', activity_type: '電話', activity_date: '2024-11-04', duration_minutes: 20 },
      { activity_id: 'act-007', rep_id: 'rep-003', activity_type: '訪問', activity_date: '2024-11-02', duration_minutes: 45 },
    ]);

    (mockDataPersistence.fetchDealsForPeriod as jest.Mock) = jest.fn().mockResolvedValue([
      { deal_id: 'deal-001', rep_id: 'rep-001', customer_id: 'cust-001', stage_id: 'stage-proposal', amount: 1000000, status: 'open', created_date: '2024-11-01' },
      { deal_id: 'deal-002', rep_id: 'rep-001', customer_id: 'cust-002', stage_id: 'stage-negotiation', amount: 500000, status: 'open', created_date: '2024-11-05' },
      { deal_id: 'deal-003', rep_id: 'rep-001', customer_id: 'cust-003', stage_id: 'stage-won', amount: 800000, status: 'closed_won', created_date: '2024-10-20' },
      { deal_id: 'deal-004', rep_id: 'rep-002', customer_id: 'cust-004', stage_id: 'stage-initial', amount: 300000, status: 'open', created_date: '2024-11-01' },
      { deal_id: 'deal-005', rep_id: 'rep-002', customer_id: 'cust-005', stage_id: 'stage-proposal', amount: 2000000, status: 'open', created_date: '2024-11-02' },
      { deal_id: 'deal-006', rep_id: 'rep-003', customer_id: 'cust-006', stage_id: 'stage-initial', amount: 150000, status: 'open', created_date: '2024-11-10' },
    ]);

    (mockDataPersistence.fetchSalesTargets as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', target_period: '2024-11', activity_count_target: 5, deal_amount_target: 2000000 },
      { rep_id: 'rep-002', target_period: '2024-11', activity_count_target: 4, deal_amount_target: 2500000 },
      { rep_id: 'rep-003', target_period: '2024-11', activity_count_target: 3, deal_amount_target: 1500000 },
    ]);

    (mockDataPersistence.fetchAllDealStages as jest.Mock) = jest.fn().mockResolvedValue([
      { stage_id: 'stage-initial', stage_name: '初期接触', sequence_order: 1 },
      { stage_id: 'stage-proposal', stage_name: '提案', sequence_order: 2 },
      { stage_id: 'stage-negotiation', stage_name: '交渉', sequence_order: 3 },
      { stage_id: 'stage-won', stage_name: '成約', sequence_order: 4 },
    ]);

    (mockDataPersistence.fetchUserPermissions as jest.Mock) = jest.fn().mockResolvedValue({
      user_id: 'user-sales-manager-001',
      has_dashboard_view_permission: true,
      accessible_departments: ['dept-sales-01'],
      accessible_reps: ['rep-001', 'rep-002', 'rep-003'],
    });

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    // Verify activityMetricsByRepresentative
    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(result.activityMetricsByRepresentative).toHaveLength(3);

    // rep-001: 4 activities (achieved 80% of 5)
    const rep001 = result.activityMetricsByRepresentative.find((m: any) => m.representativeId === 'rep-001');
    expect(rep001).toBeDefined();
    expect(rep001.totalActivityCount).toBe(4);
    expect(rep001.achievementPercentage).toBe(80);
    expect(rep001.isAnomalous).toBe(false);

    // rep-002: 2 activities (achieved 50% of 4)
    const rep002 = result.activityMetricsByRepresentative.find((m: any) => m.representativeId === 'rep-002');
    expect(rep002).toBeDefined();
    expect(rep002.totalActivityCount).toBe(2);
    expect(rep002.achievementPercentage).toBe(50);
    expect(rep002.isAnomalous).toBe(true);
    expect(rep002.anomalyReason).toContain('50%');

    // rep-003: 1 activity (achieved 33% of 3)
    const rep003 = result.activityMetricsByRepresentative.find((m: any) => m.representativeId === 'rep-003');
    expect(rep003).toBeDefined();
    expect(rep003.totalActivityCount).toBe(1);
    expect(Math.round(rep003.achievementPercentage)).toBe(33);
    expect(rep003.isAnomalous).toBe(true);
  });
});
