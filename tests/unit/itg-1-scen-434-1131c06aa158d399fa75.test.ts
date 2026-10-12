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

describe('SCEN-434: analyzeDealStageProgress - no deal data warning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should issue warning when no deal data exists for period', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { representativeId: 'rep-001', representativeName: '営業担当者A', departmentId: 'dept-001' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { activityId: 'act-001', representativeId: 'rep-001', activityType: 'visit', activityDate: '2024-01-10' },
    ]);

    // Empty deals - should trigger warning
    fetchDealsForPeriod.mockResolvedValue([]);

    fetchSalesTargets.mockResolvedValue([
      { representativeId: 'rep-001', targetAmount: 5000000, targetCount: 10 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stageId: 'stage-001', stageName: '初期接触', displayOrder: 1 },
      { stageId: 'stage-002', stageName: '提案', displayOrder: 2 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'user-sales-manager-001',
      canViewDashboard: true,
      accessibleDepartments: ['dept-001'],
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:30:00Z'),
      requestingUserId: 'user-sales-manager-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    // Verify warning is issued
    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.freshnessWarning).toBeDefined();
    expect(result.dataFreshnessStatus.freshnessWarning).toContain('対象期間の商談データが見つかりません');

    // Verify deal stage progress metrics is empty
    expect(result.dealStageProgressMetrics).toEqual([]);

    // Verify processing completed successfully (not error)
    expect(result.targetPeriod).toBe('2024-01');
  });
});
