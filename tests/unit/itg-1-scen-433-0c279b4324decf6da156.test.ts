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

describe('SCEN-433: analyzeDealStageProgress - deal stage progress metrics calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate deal stage progress metrics with achievement percentages', async () => {
    const { fetchAllSalesRepresentatives, fetchActivitiesByRepresentative, fetchDealsForPeriod, fetchSalesTargets, fetchAllDealStages, fetchUserPermissions } = require('../../src/logic/data-persistence');

    fetchAllSalesRepresentatives.mockResolvedValue([
      { rep_id: 'rep-001', rep_name: '営業担当者A', department: '営業部' },
      { rep_id: 'rep-002', rep_name: '営業担当者B', department: '営業部' },
    ]);

    fetchActivitiesByRepresentative.mockResolvedValue([
      { rep_id: 'rep-001', activity_id: 'act-001', activity_type: '訪問', activity_date: '2024-11-15' },
      { rep_id: 'rep-001', activity_id: 'act-002', activity_type: '電話', activity_date: '2024-11-20' },
      { rep_id: 'rep-002', activity_id: 'act-003', activity_type: '訪問', activity_date: '2024-11-10' },
    ]);

    fetchDealsForPeriod.mockResolvedValue([
      { deal_id: 'deal-001', rep_id: 'rep-001', stage: '初期接触', amount: 500000, status: 'in_progress' },
      { deal_id: 'deal-002', rep_id: 'rep-001', stage: '提案', amount: 800000, status: 'in_progress' },
      { deal_id: 'deal-003', rep_id: 'rep-001', stage: '成約待ち', amount: 1200000, status: 'in_progress' },
      { deal_id: 'deal-004', rep_id: 'rep-002', stage: '初期接触', amount: 300000, status: 'in_progress' },
      { deal_id: 'deal-005', rep_id: 'rep-002', stage: '提案', amount: 600000, status: 'in_progress' },
    ]);

    fetchSalesTargets.mockResolvedValue([
      { rep_id: 'rep-001', period: '2024-11', target_amount: 3000000, target_activity_count: 15 },
      { rep_id: 'rep-002', period: '2024-11', target_amount: 2000000, target_activity_count: 12 },
    ]);

    fetchAllDealStages.mockResolvedValue([
      { stage_id: 'stage-001', stage_name: '初期接触', stage_order: 1 },
      { stage_id: 'stage-002', stage_name: '提案', stage_order: 2 },
      { stage_id: 'stage-003', stage_name: '成約待ち', stage_order: 3 },
    ]);

    fetchUserPermissions.mockResolvedValue({
      user_id: 'user-dept-head-001',
      has_dashboard_view: true,
      access_level: 'department_manager',
      viewable_departments: ['営業部'],
    });

    const input: AggregateSalesPerformanceInput = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-30T23:59:59Z'),
      requestingUserId: 'user-dept-head-001',
    };

    const result = await aggregateSalesPerformanceForDashboard(input);

    // Verify deal stage progress metrics
    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(result.dealStageProgressMetrics.length).toBeGreaterThan(0);

    // Find stage metrics
    const initialContactStage = result.dealStageProgressMetrics.find(s => s.stageName === '初期接触');
    const proposalStage = result.dealStageProgressMetrics.find(s => s.stageName === '提案');
    const negotiationStage = result.dealStageProgressMetrics.find(s => s.stageName === '成約待ち');

    // Initial contact: rep-001 500000 + rep-002 300000 = 800000
    expect(initialContactStage?.totalDealAmount).toBe(800000);
    expect(initialContactStage?.totalDealCount).toBe(2);

    // Proposal: rep-001 800000 + rep-002 600000 = 1400000
    expect(proposalStage?.totalDealAmount).toBe(1400000);
    expect(proposalStage?.totalDealCount).toBe(2);

    // Negotiation: rep-001 1200000 = 1200000
    expect(negotiationStage?.totalDealAmount).toBe(1200000);
    expect(negotiationStage?.totalDealCount).toBe(1);

    // Verify each stage has achievement percentages
    expect(initialContactStage?.achievementPercentage).toBeDefined();
    expect(proposalStage?.achievementPercentage).toBeDefined();
    expect(negotiationStage?.achievementPercentage).toBeDefined();

    // Verify coaching priority ranking is present
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking.length).toBe(2);
  });
});
