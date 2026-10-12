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

describe('SCEN-431: calculateActivityPerformanceGap - no activity data warning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should issue warning when no activity data exists for period', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { salesRepId: 'rep-001', name: '営業太郎', department: '営業部' },
      { salesRepId: 'rep-002', name: '営業花子', department: '営業部' },
    ]);

    // Empty activities - should trigger warning
    fetchActivitiesByRepresentative.mockResolvedValue([]);

    fetchDealsForPeriod.mockResolvedValue([]);

    fetchSalesTargets.mockResolvedValue([
      { salesRepId: 'rep-001', period: '2024-01', targetActivityCount: 20, targetDealAmount: 1000000 },
      { salesRepId: 'rep-002', period: '2024-01', targetActivityCount: 20, targetDealAmount: 1000000 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stageId: 'stage-001', stageName: '初期接触', sequenceNumber: 1 },
      { stageId: 'stage-002', stageName: '提案', sequenceNumber: 2 },
      { stageId: 'stage-003', stageName: '交渉', sequenceNumber: 3 },
      { stageId: 'stage-004', stageName: '成約', sequenceNumber: 4 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'user-sales-manager-001',
      canViewDashboard: true,
      canAccessAllSalesReps: true,
      role: 'sales_manager',
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-sales-manager-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    // Verify warning is issued
    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.freshnessWarning).toBeDefined();
    expect(result.dataFreshnessStatus.freshnessWarning).toContain('当月の活動実績がまだ入力されていません');

    // Verify activity metrics show 0 for both representatives
    expect(result.activityMetricsByRepresentative).toHaveLength(2);
    expect(result.activityMetricsByRepresentative.every(m => m.totalActivityCount === 0)).toBe(true);
    expect(result.activityMetricsByRepresentative.every(m => m.achievementPercentage === 0)).toBe(true);

    // Verify processing completed successfully (not error)
    expect(result.targetPeriod).toBe('2024-01');
  });
});
