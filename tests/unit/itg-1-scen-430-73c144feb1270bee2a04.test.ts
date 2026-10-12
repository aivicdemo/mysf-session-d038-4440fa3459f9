import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  aggregateSalesPerformanceForDashboard,
  AggregateSalesPerformanceInput,
} from '../../src/logic/sales-performance-aggregation';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-430: calculateActivityPerformanceGap - negative target deal amount error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when target deal amount is negative', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { repId: 'STAFF-001', repName: '営業太郎', department: '営業部' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { activityId: 'ACT-001', repId: 'STAFF-001', activityType: '訪問', activityDate: '2024-01-15' },
      { activityId: 'ACT-002', repId: 'STAFF-001', activityType: '電話', activityDate: '2024-01-20' },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { dealId: 'DEAL-001', repId: 'STAFF-001', stage: '初期接触', amount: 500000 },
      { dealId: 'DEAL-002', repId: 'STAFF-001', stage: '提案', amount: 300000 },
    ]);

    // Target deal amount is negative - should trigger error
    fetchSalesTargets.mockResolvedValue([
      { repId: 'STAFF-001', targetPeriod: '2024-01', targetActivityCount: 20, targetDealAmount: -100000 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '初期接触', displayOrder: 1 },
      { stageId: 'STAGE-002', stageName: '提案', displayOrder: 2 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'USER-001',
      canViewDashboard: true,
      canViewAllRepData: true,
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-31T23:59:59Z'),
      requestingUserId: 'USER-001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow('目標商談金額は1円以上で設定してください');
  });
});
