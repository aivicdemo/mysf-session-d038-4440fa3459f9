import {
  aggregateSalesPerformanceForDashboard,
  AggregateSalesPerformanceInput,
  SalesTargetDataIncomplete,
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

describe('SCEN-403: aggregateSalesPerformanceForDashboard - 目標データ不完全エラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象期間の営業目標が一部の営業担当者について未設定のとき、SalesTargetDataIncomplete エラーが発生する', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-15T10:30:00Z');
    const requestingUserId = 'user-001';

    const allSalesRepresentatives = [
      { representativeId: 'rep-001', name: '営業太郎', department: '営業部' },
      { representativeId: 'rep-002', name: '営業花子', department: '営業部' },
      { representativeId: 'rep-003', name: '営業次郎', department: '営業部' },
    ];

    const activitiesByRepresentative = [
      { representativeId: 'rep-001', activityId: 'act-001', activityType: '訪問', activityDate: '2024-11-10' },
      { representativeId: 'rep-002', activityId: 'act-002', activityType: '電話', activityDate: '2024-11-12' },
    ];

    const dealsByRepresentative = [
      { representativeId: 'rep-001', dealId: 'deal-001', dealAmount: 1000000, stageId: 'stage-001', stageName: '初期接触' },
      { representativeId: 'rep-002', dealId: 'deal-002', dealAmount: 500000, stageId: 'stage-002', stageName: '提案' },
    ];

    // rep-003 の目標が不足（rep-001 と rep-002 のみ）
    const salesTargetsByRepresentative = [
      { representativeId: 'rep-001', targetPeriod: '2024-11', salesTarget: 2000000, activityCountTarget: 20 },
      { representativeId: 'rep-002', targetPeriod: '2024-11', salesTarget: 1500000, activityCountTarget: 15 },
    ];

    const dealStages = [
      { stageId: 'stage-001', stageName: '初期接触', sequenceOrder: 1 },
      { stageId: 'stage-002', stageName: '提案', sequenceOrder: 2 },
    ];

    const userPermissions = {
      userId: 'user-001',
      canViewDashboard: true,
      viewableRepresentativeIds: ['rep-001', 'rep-002', 'rep-003'],
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

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(SalesTargetDataIncomplete);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '営業目標データが不完全です。達成度計算ができない担当者があります。'
    );
  });
});
