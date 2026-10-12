import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  aggregateSalesPerformanceForDashboard,
  AggregateSalesPerformanceInput,
  InvalidTargetPeriodFormat,
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

describe('SCEN-436: analyzeDealStageProgress - invalid target period format error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when target period is not in YYYY-MM format', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { rep_id: 'rep_001', rep_name: '営業太郎', department_id: 'dept_001' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { rep_id: 'rep_001', activity_date: '2024-01-10', activity_type: 'visit', count: 5 },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { deal_id: 'deal_001', rep_id: 'rep_001', stage_id: 'stage_01', amount: 1000000, status: 'in_progress' },
    ]);

    fetchSalesTargets.mockResolvedValue([
      { rep_id: 'rep_001', target_period: '2024-01', activity_target: 20, amount_target: 5000000 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stage_id: 'stage_01', stage_name: '初期接触', sequence: 1 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      user_id: 'user_001',
      can_view_dashboard: true,
      accessible_departments: ['dept_001'],
    });

    // Invalid format: 2024/01 instead of 2024-01
    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024/01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user_001',
    };

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow('集計対象期間の形式が不正です。YYYY-MM形式で指定してください。');
  });
});
