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

describe('SCEN-437: calculateCoachingPriorityRanking - priority scoring calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate coaching priority ranking with comprehensive scoring', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { salesStaffId: 'rep-001', name: '営業太郎', department: '営業部' },
      { salesStaffId: 'rep-002', name: '営業花子', department: '営業部' },
      { salesStaffId: 'rep-003', name: '営業次郎', department: '営業部' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { salesStaffId: 'rep-001', activityDate: '2024-11-15', activityType: '訪問', count: 1 },
      { salesStaffId: 'rep-001', activityDate: '2024-11-20', activityType: '電話', count: 1 },
      { salesStaffId: 'rep-002', activityDate: '2024-11-10', activityType: 'メール', count: 1 },
      { salesStaffId: 'rep-002', activityDate: '2024-11-25', activityType: '訪問', count: 1 },
      { salesStaffId: 'rep-003', activityDate: '2024-11-05', activityType: '電話', count: 1 },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { dealId: 'deal-001', salesStaffId: 'rep-001', amount: 5000000, stage: '提案', stageId: 'stage-002', lastUpdatedDate: '2024-11-20' },
      { dealId: 'deal-002', salesStaffId: 'rep-001', amount: 3000000, stage: '交渉', stageId: 'stage-003', lastUpdatedDate: '2024-11-18' },
      { dealId: 'deal-003', salesStaffId: 'rep-002', amount: 8000000, stage: '初期接触', stageId: 'stage-001', lastUpdatedDate: '2024-11-05' },
      { dealId: 'deal-004', salesStaffId: 'rep-002', amount: 2000000, stage: '成約待ち', stageId: 'stage-004', lastUpdatedDate: '2024-11-28' },
      { dealId: 'deal-005', salesStaffId: 'rep-003', amount: 6000000, stage: '初期接触', stageId: 'stage-001', lastUpdatedDate: '2024-11-01' },
    ]);

    fetchSalesTargets.mockResolvedValue([
      { salesStaffId: 'rep-001', targetActivityCount: 15, targetDealAmount: 10000000 },
      { salesStaffId: 'rep-002', targetActivityCount: 15, targetDealAmount: 12000000 },
      { salesStaffId: 'rep-003', targetActivityCount: 15, targetDealAmount: 10000000 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stageId: 'stage-001', stageName: '初期接触', order: 1 },
      { stageId: 'stage-002', stageName: '提案', order: 2 },
      { stageId: 'stage-003', stageName: '交渉', order: 3 },
      { stageId: 'stage-004', stageName: '成約待ち', order: 4 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      userId: 'user-sales-manager-001',
      canViewDashboard: true,
      canViewAllRepresentatives: true,
      accessibleRepresentativeIds: ['rep-001', 'rep-002', 'rep-003'],
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-sales-manager-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    // Verify coaching priority ranking
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking).toHaveLength(3);

    // Rep-003 should be rank 1 (highest priority) - only 1 activity (6.67%), deal stuck in initial contact for 29 days
    const rep003 = result.coachingPriorityRanking.find(r => r.representativeId === 'rep-003');
    expect(rep003?.rank).toBe(1);
    expect(rep003?.priorityLevel).toBe('高');

    // Rep-002 should be rank 2 - 2 activities (13.33%), activity stuck in initial contact
    const rep002 = result.coachingPriorityRanking.find(r => r.representativeId === 'rep-002');
    expect(rep002?.rank).toBe(2);
    expect(rep002?.priorityLevel).toMatch(/中|低/);

    // Rep-001 should be rank 3 - 2 activities (13.33%) but better deal progression
    const rep001 = result.coachingPriorityRanking.find(r => r.representativeId === 'rep-001');
    expect(rep001?.rank).toBe(3);

    // Verify priority scores are in valid range (0-100)
    result.coachingPriorityRanking.forEach(item => {
      expect(item.priorityScore).toBeGreaterThanOrEqual(0);
      expect(item.priorityScore).toBeLessThanOrEqual(100);
    });

    // Verify scoring factors are populated
    result.coachingPriorityRanking.forEach(item => {
      expect(item.scoringFactors).toBeDefined();
      expect(item.scoringFactors.length).toBeGreaterThan(0);
    });

    // Verify anomalous metrics include rep-003
    const rep003Anomaly = result.anomalousMetrics.find(a => a.representativeId === 'rep-003');
    expect(rep003Anomaly).toBeDefined();
  });
});
