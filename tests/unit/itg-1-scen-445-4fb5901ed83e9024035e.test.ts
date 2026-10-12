import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-445: coachingPriorityRanking with scores and actions', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should rank representatives by coaching priority with scoring and actions', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-30T23:59:59Z');
    const requestingUserId = 'user-sales-manager-001';

    (mockDataPersistence.fetchAllSalesRepresentatives as jest.Mock) = jest.fn().mockResolvedValue([
      { repId: 'rep-001', repName: '営業太郎', department: '営業部' },
      { repId: 'rep-002', repName: '営業花子', department: '営業部' },
      { repId: 'rep-003', repName: '営業次郎', department: '営業部' },
    ]);

    (mockDataPersistence.fetchActivitiesByRepresentative as jest.Mock) = jest.fn().mockResolvedValue([
      { repId: 'rep-001', activityId: 'act-001', activityType: '訪問', activityDate: '2024-11-15', count: 1 },
      { repId: 'rep-001', activityId: 'act-002', activityType: '電話', activityDate: '2024-11-20', count: 1 },
      { repId: 'rep-002', activityId: 'act-003', activityType: '訪問', activityDate: '2024-11-10', count: 1 },
      { repId: 'rep-003', activityId: 'act-004', activityType: 'メール', activityDate: '2024-11-25', count: 1 },
    ]);

    (mockDataPersistence.fetchDealsForPeriod as jest.Mock) = jest.fn().mockResolvedValue([
      { dealId: 'deal-001', repId: 'rep-001', stageId: 'stage-proposal', stageName: '提案', amount: 5000000, status: 'in_progress', lastUpdated: '2024-11-25' },
      { dealId: 'deal-002', repId: 'rep-001', stageId: 'stage-negotiation', stageName: '交渉', amount: 3000000, status: 'in_progress', lastUpdated: '2024-11-10' },
      { dealId: 'deal-003', repId: 'rep-002', stageId: 'stage-initial_contact', stageName: '初期接触', amount: 2000000, status: 'in_progress', lastUpdated: '2024-11-05' },
      { dealId: 'deal-004', repId: 'rep-003', stageId: 'stage-proposal', stageName: '提案', amount: 1500000, status: 'completed', lastUpdated: '2024-11-20' },
    ]);

    (mockDataPersistence.fetchSalesTargets as jest.Mock) = jest.fn().mockResolvedValue([
      { repId: 'rep-001', targetPeriod: '2024-11', targetActivityCount: 15, targetDealAmount: 10000000 },
      { repId: 'rep-002', targetPeriod: '2024-11', targetActivityCount: 12, targetDealAmount: 8000000 },
      { repId: 'rep-003', targetPeriod: '2024-11', targetActivityCount: 18, targetDealAmount: 12000000 },
    ]);

    (mockDataPersistence.fetchAllDealStages as jest.Mock) = jest.fn().mockResolvedValue([
      { stageId: 'stage-initial_contact', stageName: '初期接触', order: 1 },
      { stageId: 'stage-proposal', stageName: '提案', order: 2 },
      { stageId: 'stage-negotiation', stageName: '交渉', order: 3 },
      { stageId: 'stage-won', stageName: '成約', order: 4 },
    ]);

    (mockDataPersistence.fetchUserPermissions as jest.Mock) = jest.fn().mockResolvedValue({
      userId: 'user-sales-manager-001',
      canViewDashboard: true,
      canViewAllRepresentatives: true,
      canViewFinancialData: true,
      permissionLevel: 'manager',
    });

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.coachingPriorityRanking).toHaveLength(3);

    // Verify ranking order: rep-003 > rep-002 > rep-001 (by priority score)
    const ranking = result.coachingPriorityRanking;

    // First rank should have highest priority score
    const firstRank = ranking[0];
    expect(firstRank.rank).toBe(1);
    expect(firstRank.priorityScore).toBeGreaterThanOrEqual(70);

    // Each item should have required fields
    ranking.forEach((item: any) => {
      expect(item.rank).toBeDefined();
      expect(item.representativeId).toBeDefined();
      expect(item.representativeName).toBeDefined();
      expect(item.priorityScore).toBeDefined();
      expect(item.priorityLevel).toBeDefined();
      expect(item.scoringFactors).toBeDefined();
      expect(item.recommendedAction).toBeDefined();
    });

    // Verify ranking is sorted by priority score (descending)
    for (let i = 0; i < ranking.length - 1; i++) {
      expect(ranking[i].priorityScore).toBeGreaterThanOrEqual(ranking[i + 1].priorityScore);
    }
  });
});
