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

describe('SCEN-429: calculateActivityPerformanceGap - target activity count zero error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when target activity count is 0', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { repId: 'REP001', repName: '営業担当者A', departmentId: 'DEPT001' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { activityId: 'ACT001', repId: 'REP001', activityType: 'visit', activityDate: '2024-11-10' },
      { activityId: 'ACT002', repId: 'REP001', activityType: 'call', activityDate: '2024-11-12' },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { dealId: 'DEAL001', repId: 'REP001', stageId: 'STAGE_INITIAL', amount: 500000, status: 'open' },
      { dealId: 'DEAL002', repId: 'REP001', stageId: 'STAGE_PROPOSAL', amount: 1000000, status: 'open' },
    ]);

    // Target activity count is 0 - should trigger error
    fetchSalesTargets.mockResolvedValue([
      { repId: 'REP001', period: '2024-11', targetActivityCount: 0, targetDealAmount: 1500000 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stageId: 'STAGE_INITIAL', stageName: '初期接触', sequenceOrder: 1 },
      { stageId: 'STAGE_PROPOSAL', stageName: '提案', sequenceOrder: 2 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'USER001',
      permissions: ['DASHBOARD_VIEW'],
      dataAccessLevel: 'ALL',
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:00:00Z'),
      requestingUserId: 'USER001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow('目標活動件数は1件以上で設定してください');
  });
});
