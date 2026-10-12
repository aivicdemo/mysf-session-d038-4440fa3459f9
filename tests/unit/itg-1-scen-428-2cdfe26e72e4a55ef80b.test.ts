import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  aggregateSalesPerformanceForDashboard,
  AggregateSalesPerformanceInput,
  AggregateSalesPerformanceOutput,
} from '../../src/logic/sales-performance-aggregation';

// Mock the data persistence layer
jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-428: calculateActivityPerformanceGap with full aggregation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should aggregate sales performance and calculate coaching priority ranking', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    // Set up mock return values
    fetchAllSalesRepresentatives.mockResolvedValue([
      { rep_id: 'rep_001', rep_name: '営業太郎', department: '営業部' },
      { rep_id: 'rep_002', rep_name: '営業花子', department: '営業部' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { rep_id: 'rep_001', activity_date: '2024-11-15', activity_type: 'visit', count: 8 },
      { rep_id: 'rep_001', activity_date: '2024-11-20', activity_type: 'call', count: 5 },
      { rep_id: 'rep_002', activity_date: '2024-11-10', activity_type: 'visit', count: 6 },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { deal_id: 'deal_001', rep_id: 'rep_001', stage_id: 'stage_proposal', amount: 5000000, status: 'in_progress' },
      { deal_id: 'deal_002', rep_id: 'rep_001', stage_id: 'stage_negotiation', amount: 3000000, status: 'in_progress' },
      { deal_id: 'deal_003', rep_id: 'rep_002', stage_id: 'stage_initial_contact', amount: 2000000, status: 'in_progress' },
    ]);

    fetchSalesTargets.mockResolvedValue([
      { rep_id: 'rep_001', period: '2024-11', target_activity_count: 15, target_deal_amount: 10000000 },
      { rep_id: 'rep_002', period: '2024-11', target_activity_count: 12, target_deal_amount: 8000000 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stage_id: 'stage_initial_contact', stage_name: '初期接触', order: 1 },
      { stage_id: 'stage_proposal', stage_name: '提案', order: 2 },
      { stage_id: 'stage_negotiation', stage_name: '交渉', order: 3 },
      { stage_id: 'stage_contract', stage_name: '成約', order: 4 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      user_id: 'user_dept_manager_001',
      has_dashboard_view: true,
      accessible_departments: ['営業部'],
      role: 'department_manager',
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user_dept_manager_001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    // Verify output structure and values
    expect(result).toBeDefined();
    expect(result.targetPeriod).toBe('2024-11');
    expect(result.aggregationTimestamp).toBeDefined();
    expect(result.activityMetricsByRepresentative).toHaveLength(2);

    // Check activity metrics for rep_001 (13 activities / 15 target = 86.67%)
    const rep001Activity = result.activityMetricsByRepresentative.find(a => a.representativeId === 'rep_001');
    expect(rep001Activity).toBeDefined();
    expect(rep001Activity?.totalActivityCount).toBe(13);
    expect(rep001Activity?.achievementPercentage).toBeCloseTo(86.67, 1);

    // Check activity metrics for rep_002 (6 activities / 12 target = 50%)
    const rep002Activity = result.activityMetricsByRepresentative.find(a => a.representativeId === 'rep_002');
    expect(rep002Activity).toBeDefined();
    expect(rep002Activity?.totalActivityCount).toBe(6);
    expect(rep002Activity?.achievementPercentage).toBeCloseTo(50, 1);

    // Check deal stage progress metrics
    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(result.dealStageProgressMetrics.length).toBeGreaterThan(0);

    // Check coaching priority ranking
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking.length).toBe(2);

    // rep_002 should have higher priority (lower performance)
    expect(result.coachingPriorityRanking[0].representativeId).toBe('rep_002');
    expect(result.coachingPriorityRanking[0].rank).toBe(1);
    expect(result.coachingPriorityRanking[1].representativeId).toBe('rep_001');
    expect(result.coachingPriorityRanking[1].rank).toBe(2);

    // Check anomalous metrics
    expect(result.anomalousMetrics).toBeDefined();
    const rep002Anomaly = result.anomalousMetrics.find(a => a.representativeId === 'rep_002');
    expect(rep002Anomaly).toBeDefined();
    expect(rep002Anomaly?.anomalyDescription).toContain('活動件数が目標の50%');

    // Check data freshness status
    expect(result.dataFreshnessStatus).toBeDefined();
    expect(result.dataFreshnessStatus.isFresh).toBe(true);
  });
});
