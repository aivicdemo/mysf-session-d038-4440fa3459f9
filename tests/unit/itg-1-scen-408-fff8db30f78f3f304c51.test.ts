import {
  aggregateSalesPerformanceForDashboard,
  AggregateSalesPerformanceInput,
  DataFetchFailure,
} from '../../src/logic/sales-performance-aggregation';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

jest.mock('../../src/logic/access-control-enforcement', () => ({
  ...jest.requireActual<typeof import('../../src/logic/access-control-enforcement')>(
    '../../src/logic/access-control-enforcement'
  ),
  enforceAccessControlForDataDisplay: jest.fn(),
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import * as accessControl from '../../src/logic/access-control-enforcement';

describe('SCEN-408: aggregateSalesPerformanceForDashboard - データ取得失敗エラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchSalesTargets の呼び出しが DataStoreError で失敗したとき、DataFetchFailure エラーが発生する', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-15T10:30:00Z');
    const requestingUserId = 'user-sales-mgr-001';

    const mockRepresentatives = [
      { rep_id: 'rep-001', rep_name: '営業太郎', department: '営業部' },
      { rep_id: 'rep-002', rep_name: '営業花子', department: '営業部' },
    ];

    const mockActivities = [
      { rep_id: 'rep-001', activity_date: '2024-11-01', activity_type: '訪問' },
      { rep_id: 'rep-001', activity_date: '2024-11-05', activity_type: '電話' },
    ];

    const mockDeals = [
      { deal_id: 'deal-001', rep_id: 'rep-001', amount: 500000, stage: '提案' },
    ];

    const mockStages = [
      { stage_id: 'stage-01', stage_name: '初期接触' },
      { stage_id: 'stage-02', stage_name: '提案' },
      { stage_id: 'stage-03', stage_name: '交渉' },
      { stage_id: 'stage-04', stage_name: '成約待ち' },
    ];

    const mockPermissions = {
      user_id: 'user-sales-mgr-001',
      can_view_dashboard: true,
      accessible_departments: ['営業部'],
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockRepresentatives);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue(mockActivities);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockRejectedValue(new Error('DataStoreError'));
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockStages);
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(mockPermissions);

    const input: AggregateSalesPerformanceInput = {
      targetPeriod,
      currentDate,
      requestingUserId,
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(DataFetchFailure);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      'ダッシュボード表示に必要なデータ取得に失敗しました。'
    );
  });
});
