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

describe('SCEN-424: aggregateSalesPerformanceForDashboard - 営業担当者IDが空', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者IDが空のとき、例外「営業担当者IDを指定してください」を発生させる', async () => {
    const targetPeriod = '2024-01';
    const currentDate = new Date('2024-01-31T23:59:59Z');
    const requestingUserId = 'USER001';

    const allSalesRepresentatives = [
      { rep_id: 'REP001', rep_name: '営業太郎', department: '営業部' },
    ];

    const activitiesByRepresentative = [
      { activity_id: 'ACT001', rep_id: 'REP001', activity_type: 'visit', activity_date: '2024-01-15' },
    ];

    const dealsByRepresentative = [
      { deal_id: 'DEAL001', rep_id: 'REP001', customer_id: 'CUST001', amount: 500000, stage: 'closed_won' },
    ];

    const salesTargetsByRepresentative = [
      { rep_id: 'REP001', target_period: '2024-01', activity_target: 10, revenue_target: 1000000 },
    ];

    const dealStages = [
      { stage_id: 'STAGE001', stage_name: '初期接触', sequence: 1 },
      { stage_id: 'STAGE002', stage_name: '提案', sequence: 2 },
    ];

    const userPermissions = {
      user_id: 'USER001',
      can_view_dashboard: true,
      can_view_all_reps: true,
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(allSalesRepresentatives);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue(activitiesByRepresentative);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(dealsByRepresentative);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValue(salesTargetsByRepresentative);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(dealStages);
    (accessControl.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue(userPermissions);

    const input: AggregateSalesPerformanceInput = {
      targetPeriod,
      currentDate,
      requestingUserId,
    };

    // 営業担当者IDが空という条件で例外が発生することを期待
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '営業担当者IDを指定してください'
    );
  });
});
