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

describe('SCEN-435: analyzeDealStageProgress - missing stage target error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when stage has no monthly target amount', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { representativeId: 'rep-001', representativeName: '営業太郎', departmentId: 'dept-sales' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { activityId: 'activity-001', representativeId: 'rep-001', activityType: 'visit', activityDate: '2024-01-10', customerId: 'customer-001' },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { dealId: 'deal-001', representativeId: 'rep-001', stageId: 'stage-initial', stageName: '初期接触', amount: 500000, dealDate: '2024-01-05' },
      { dealId: 'deal-002', representativeId: 'rep-001', stageId: 'stage-proposal', stageName: '提案', amount: 1000000, dealDate: '2024-01-08' },
    ]);

    fetchSalesTargets.mockResolvedValue([
      { representativeId: 'rep-001', targetMonth: '2024-01', activityCountTarget: 20, dealAmountTarget: 5000000 },
    ]);

    // Stage-negotiation has null monthly target amount - should trigger error
    fetchAllDealStages.mockResolvedValue([
      { stageId: 'stage-initial', stageName: '初期接触', sequenceOrder: 1, monthlyTargetCount: 10, monthlyTargetAmount: 2000000 },
      { stageId: 'stage-proposal', stageName: '提案', sequenceOrder: 2, monthlyTargetCount: 8, monthlyTargetAmount: 3000000 },
      { stageId: 'stage-negotiation', stageName: '交渉', sequenceOrder: 3, monthlyTargetCount: 5, monthlyTargetAmount: null },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'user-001',
      dashboardViewPermission: true,
      accessibleRepresentatives: ['rep-001'],
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow('目標値が未設定のステージがあります');
  });
});
