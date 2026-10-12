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

describe('SCEN-415: aggregateSalesPerformanceForDashboard - 会計年度開始月が無効', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('会計年度開始月が0のとき、例外「会計年度開始月の設定が不正です。1～12の値を指定してください。」を発生させる', async () => {
    const targetPeriod = '2024-01';
    const currentDate = new Date('2024-01-15T10:00:00Z');
    const requestingUserId = 'user-001';

    const mockRepresentatives = [
      { repId: 'rep-001', repName: '営業太郎', departmentId: 'dept-001' },
    ];

    const mockActivities = [
      { activityId: 'act-001', repId: 'rep-001', activityType: '訪問', activityDate: '2024-01-10' },
    ];

    const mockDeals = [
      { dealId: 'deal-001', repId: 'rep-001', amount: 1000000, stageId: 'stage-001', status: 'completed' },
    ];

    const mockTargets = [
      { repId: 'rep-001', targetAmount: 5000000, targetActivityCount: 50 },
    ];

    const mockStages = [
      { stageId: 'stage-001', stageName: '初期接触' },
      { stageId: 'stage-002', stageName: '提案' },
    ];

    const mockPermissions = {
      userId: 'user-001',
      canViewDashboard: true,
      accessLevel: 'manager',
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

    // 会計年度開始月が 0 という無効な値で例外が発生することを期待
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '会計年度開始月の設定が不正です。1～12の値を指定してください。'
    );
  });
});
