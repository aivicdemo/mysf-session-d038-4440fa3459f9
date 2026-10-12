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

describe('SCEN-439: calculateCoachingPriorityRanking - zero activity target error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when activity target count is 0', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { salesRepId: 'STAFF-001', name: '営業担当者A', department: '営業部' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { activityId: 'ACT-001', salesRepId: 'STAFF-001', activityType: 'visit', activityDate: '2024-11-10', count: 1 },
      { activityId: 'ACT-002', salesRepId: 'STAFF-001', activityType: 'call', activityDate: '2024-11-12', count: 1 },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { dealId: 'DEAL-001', salesRepId: 'STAFF-001', stage: 'proposal', amount: 500000, lastUpdated: '2024-11-08' },
    ]);

    // Target activity count is 0 - should trigger error
    fetchSalesTargets.mockResolvedValue([
      { salesRepId: 'STAFF-001', targetActivityCount: 0, targetDealAmount: 600000, period: '2024-11' },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stageId: 'STAGE-001', stageName: '初期接触' },
      { stageId: 'STAGE-002', stageName: '提案' },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'USER-MANAGER-001',
      canViewDashboard: true,
      accessLevel: 'manager',
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:00:00Z'),
      requestingUserId: 'USER-MANAGER-001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow('目標値が正しく設定されていません');
  });
});
