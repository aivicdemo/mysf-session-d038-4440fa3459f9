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

describe('SCEN-438: aggregateSalesPerformanceForDashboard - 営業担当者IDが不正', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者IDが空のとき、例外「営業担当者IDが不正です」を発生させる', async () => {
    const targetPeriod = '2024-10';
    const currentDate = new Date('2024-10-15T10:00:00Z');
    const requestingUserId = 'user-001';

    const mockRepresentatives = [
      { representativeId: 'rep-001', name: '営業太郎', department: '営業部' },
      { representativeId: 'rep-002', name: '営業花子', department: '営業部' },
    ];

    const mockActivities = [
      { representativeId: 'rep-001', activityType: '訪問', activityDate: '2024-10-10', count: 15 },
    ];

    const mockDeals = [
      { representativeId: 'rep-001', dealId: 'deal-001', amount: 500000, stage: '提案', lastUpdated: '2024-10-10' },
    ];

    const mockTargets = [
      { representativeId: 'rep-001', targetActivityCount: 20, targetDealAmount: 600000 },
      { representativeId: 'rep-002', targetActivityCount: 20, targetDealAmount: 600000 },
    ];

    const mockStages = [
      { stageId: 'stage-001', stageName: '初期接触' },
      { stageId: 'stage-002', stageName: '提案' },
      { stageId: 'stage-003', stageName: '交渉' },
      { stageId: 'stage-004', stageName: '成約待ち' },
    ];

    const mockPermissions = {
      userId: 'user-001',
      canViewDashboard: true,
      canAccessAllRepresentatives: true,
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

    // 営業担当者IDが不正という条件で例外が発生することを期待
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '営業担当者IDが不正です'
    );
  });
});
