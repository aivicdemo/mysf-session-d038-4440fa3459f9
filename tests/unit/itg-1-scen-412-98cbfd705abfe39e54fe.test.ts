import {
  aggregateSalesPerformanceForDashboard,
  AggregateSalesPerformanceInput,
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

describe('SCEN-412: aggregateSalesPerformanceForDashboard - 月次締め日が無効', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('月次締め日が32のとき、例外「月次締め日の設定が不正です。1～31の値を指定してください。」を発生させる', async () => {
    const targetPeriod = '2024-10';
    const currentDate = new Date('2024-10-15');
    const requestingUserId = 'user-001';

    const mockRepresentatives = [
      { rep_id: 'rep-001', rep_name: '営業太郎' },
    ];

    const mockActivities = [
      { activity_id: 'act-001', rep_id: 'rep-001', activity_date: '2024-10-10', activity_type: '訪問' },
    ];

    const mockDeals = [
      { deal_id: 'deal-001', rep_id: 'rep-001', amount: 1000000, stage: 'initial_contact', status: 'open' },
    ];

    const mockTargets = [
      { rep_id: 'rep-001', target_amount: 5000000, target_activity_count: 20 },
    ];

    const mockStages = [
      { stage_id: 'stage-001', stage_name: '初期接触', sequence: 1 },
    ];

    const mockPermissions = {
      user_id: 'user-001',
      can_view_dashboard: true,
      view_scope: 'own_team',
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockRepresentatives);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue(mockActivities);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValue(mockTargets);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockStages);
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(mockPermissions);

    const input: AggregateSalesPerformanceInput = {
      targetPeriod,
      currentDate,
      requestingUserId,
    };

    // 月次締め日が 32 という無効な値で例外が発生することを期待
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '月次締め日の設定が不正です。1～31の値を指定してください。'
    );
  });
});
