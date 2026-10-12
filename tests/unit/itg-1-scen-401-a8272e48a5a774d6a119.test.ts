import { aggregateSalesPerformanceForDashboard, NoActivityDataForPeriod } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-401: NoActivityDataForPeriod error when no activity data exists for the period', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoActivityDataForPeriod error when fetchActivitiesByRepresentative returns empty array', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:30:00Z'),
      requestingUserId: 'user-001',
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValueOnce([
      { id: 'rep-001', name: '山田太郎', department: '営業部' },
      { id: 'rep-002', name: '鈴木花子', department: '営業部' },
    ]);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValueOnce([]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValueOnce([
      { deal_id: 'deal-001', rep_id: 'rep-001', amount: 500000, stage: '成約待ち', period: '2024-11' },
    ]);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValueOnce([
      { rep_id: 'rep-001', target_amount: 1000000, target_activity_count: 20, period: '2024-11' },
      { rep_id: 'rep-002', target_amount: 1000000, target_activity_count: 20, period: '2024-11' },
    ]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValueOnce([
      { stage_id: 'stage-01', stage_name: '初期接触' },
      { stage_id: 'stage-02', stage_name: '提案' },
      { stage_id: 'stage-03', stage_name: '交渉' },
      { stage_id: 'stage-04', stage_name: '成約待ち' },
    ]);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValueOnce({
      user_id: 'user-001',
      can_view_dashboard: true,
      accessible_reps: ['rep-001', 'rep-002'],
    });

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(NoActivityDataForPeriod);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '対象期間内の営業活動実績がありません。'
    );
  });
});
