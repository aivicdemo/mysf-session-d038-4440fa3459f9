import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-446: anomalousMetrics detection with alerts', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect anomalous metrics and return alerts with recommendations', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-30T23:59:59Z');
    const requestingUserId = 'user-001';

    (mockDataPersistence.fetchAllSalesRepresentatives as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', rep_name: '営業太郎', department: '営業部' },
      { rep_id: 'rep-002', rep_name: '営業花子', department: '営業部' },
    ]);

    (mockDataPersistence.fetchActivitiesByRepresentative as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', activity_id: 'act-001', activity_type: '訪問', activity_date: '2024-11-15' },
      { rep_id: 'rep-001', activity_id: 'act-002', activity_type: '電話', activity_date: '2024-11-20' },
      { rep_id: 'rep-002', activity_id: 'act-003', activity_type: 'メール', activity_date: '2024-11-10' },
    ]);

    (mockDataPersistence.fetchDealsForPeriod as jest.Mock) = jest.fn().mockResolvedValue([
      { deal_id: 'deal-001', rep_id: 'rep-001', deal_amount: 500000, stage: '提案', status: 'active' },
      { deal_id: 'deal-002', rep_id: 'rep-001', deal_amount: 300000, stage: '成約', status: 'completed' },
      { deal_id: 'deal-003', rep_id: 'rep-002', deal_amount: 450000, stage: '初期接触', status: 'active' },
    ]);

    (mockDataPersistence.fetchSalesTargets as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', target_amount: 1000000, target_activity_count: 10 },
      { rep_id: 'rep-002', target_amount: 900000, target_activity_count: 8 },
    ]);

    (mockDataPersistence.fetchAllDealStages as jest.Mock) = jest.fn().mockResolvedValue([
      { stage_id: 'stage-001', stage_name: '初期接触', sequence: 1 },
      { stage_id: 'stage-002', stage_name: '提案', sequence: 2 },
      { stage_id: 'stage-003', stage_name: '成約', sequence: 3 },
    ]);

    (mockDataPersistence.fetchUserPermissions as jest.Mock) = jest.fn().mockResolvedValue({
      user_id: 'user-001',
      can_view_dashboard: true,
      can_view_all_reps: true,
      accessible_rep_ids: ['rep-001', 'rep-002'],
    });

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    expect(result.anomalousMetrics).toBeDefined();
    expect(result.anomalousMetrics).toBeInstanceOf(Array);

    // Should contain anomalies for underachieving representatives
    const anomalies = result.anomalousMetrics;

    // rep-001: 80% revenue achievement (below threshold)
    const rep001RevAnomalyExists = anomalies.some((a: any) =>
      a.representativeId === 'rep-001' &&
      a.metricName?.includes('売上') &&
      a.highlightColor === 'red'
    );
    expect(rep001RevAnomalyExists).toBe(true);

    // rep-001: 20% activity achievement (below threshold)
    const rep001ActAnomalyExists = anomalies.some((a: any) =>
      a.representativeId === 'rep-001' &&
      a.metricName?.includes('活動')
    );
    expect(rep001ActAnomalyExists).toBe(true);

    // rep-002: 50% revenue achievement (below threshold)
    const rep002RevAnomalyExists = anomalies.some((a: any) =>
      a.representativeId === 'rep-002' &&
      a.metricName?.includes('売上')
    );
    expect(rep002RevAnomalyExists).toBe(true);

    // Each anomaly should have required fields
    anomalies.forEach((anomaly: any) => {
      expect(anomaly.alertId).toBeDefined();
      expect(anomaly.metricName).toBeDefined();
      expect(anomaly.anomalyDescription).toBeDefined();
      expect(anomaly.actualValue).toBeDefined();
      expect(anomaly.highlightColor).toBeDefined();
      expect(anomaly.severity).toBeDefined();
      expect(anomaly.recommendedResponse).toBeDefined();
    });
  });
});
