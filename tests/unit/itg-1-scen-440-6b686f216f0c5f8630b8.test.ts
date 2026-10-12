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

describe('SCEN-440: calculateCoachingPriorityRanking - negative deal amount target error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when deal amount target is negative', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { representativeId: 'REP001', representativeName: '営業太郎' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { representativeId: 'REP001', activityType: 'visit', activityDate: '2024-01-10', count: 15 },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { representativeId: 'REP001', dealId: 'DEAL001', dealAmount: 300000, stageId: 'STAGE001', stageName: 'initialContact', dealCount: 3 },
    ]);

    // Target deal amount is negative - should trigger error
    fetchSalesTargets.mockResolvedValue([
      { representativeId: 'REP001', representativeName: '営業太郎', targetPeriod: '2024-01', salesTargetAmount: -500000, targetActivityCount: 20, targetDealCount: 5 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stageId: 'STAGE001', stageName: 'initialContact' },
      { stageId: 'STAGE002', stageName: 'proposal' },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'USER001',
      canViewDashboard: true,
      accessibleRepresentativeIds: ['REP001'],
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'USER001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow('目標値が正しく設定されていません');
  });
});
