import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-447: dataFreshnessStatus with timestamp and freshness checks', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include dataFreshnessStatus with timestamp and freshness indicators', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-30T23:59:59Z');
    const requestingUserId = 'user-sales-manager-001';

    (mockDataPersistence.fetchAllSalesRepresentatives as jest.Mock) = jest.fn().mockResolvedValue([
      { representativeId: 'rep-001', name: '営業太郎', departmentId: 'dept-sales-01' },
      { representativeId: 'rep-002', name: '営業花子', departmentId: 'dept-sales-01' },
    ]);

    (mockDataPersistence.fetchActivitiesByRepresentative as jest.Mock) = jest.fn().mockResolvedValue([
      { representativeId: 'rep-001', activityDate: '2024-11-15', activityType: 'visit', count: 8 },
      { representativeId: 'rep-002', activityDate: '2024-11-20', activityType: 'call', count: 5 },
    ]);

    (mockDataPersistence.fetchDealsForPeriod as jest.Mock) = jest.fn().mockResolvedValue([
      { dealId: 'deal-001', representativeId: 'rep-001', stageId: 'stage-negotiation', amount: 500000, status: 'ongoing' },
      { dealId: 'deal-002', representativeId: 'rep-002', stageId: 'stage-proposal', amount: 300000, status: 'ongoing' },
    ]);

    (mockDataPersistence.fetchSalesTargets as jest.Mock) = jest.fn().mockResolvedValue([
      { representativeId: 'rep-001', targetPeriod: '2024-11', activityTarget: 10, dealAmountTarget: 1000000 },
      { representativeId: 'rep-002', targetPeriod: '2024-11', activityTarget: 8, dealAmountTarget: 800000 },
    ]);

    (mockDataPersistence.fetchAllDealStages as jest.Mock) = jest.fn().mockResolvedValue([
      { stageId: 'stage-initial', stageName: '初期接触', sequence: 1 },
      { stageId: 'stage-proposal', stageName: '提案', sequence: 2 },
      { stageId: 'stage-negotiation', stageName: '交渉', sequence: 3 },
      { stageId: 'stage-won', stageName: '成約', sequence: 4 },
    ]);

    (mockDataPersistence.fetchUserPermissions as jest.Mock) = jest.fn().mockResolvedValue({
      userId: 'user-sales-manager-001',
      hasDashboardViewPermission: true,
      accessibleDepartments: ['dept-sales-01'],
      canViewAllRepresentatives: true,
    });

    const result = await aggregateSalesPerformanceForDashboard({
      targetPeriod,
      currentDate,
      requestingUserId,
    });

    expect(result.dataFreshnessStatus).toBeDefined();
    const freshness = result.dataFreshnessStatus;

    // Verify timestamp
    expect(freshness.lastUpdateTimestamp).toBeDefined();
    expect(freshness.lastUpdateTimestamp).toEqual(currentDate);

    // Verify freshness indicators
    expect(freshness.dataAgeMinutes).toBeDefined();
    expect(typeof freshness.dataAgeMinutes).toBe('number');
    expect(freshness.freshnessThresholdMinutes).toBeDefined();
    expect(typeof freshness.freshnessThresholdMinutes).toBe('number');

    // Verify freshness status
    expect(freshness.isFresh).toBeDefined();
    expect(typeof freshness.isFresh).toBe('boolean');

    // Since data age should be 0 (just created), it should be fresh
    if (freshness.dataAgeMinutes === 0) {
      expect(freshness.isFresh).toBe(true);
    }

    // Warning message should exist only if not fresh
    if (!freshness.isFresh) {
      expect(freshness.freshnessWarning).toBeDefined();
      expect(typeof freshness.freshnessWarning).toBe('string');
    }

    // Verify aggregation timestamp matches
    expect(result.aggregationTimestamp).toBeDefined();
    expect(result.targetPeriod).toBe('2024-11');

    // Verify other output fields exist
    expect(result.activityMetricsByRepresentative).toBeDefined();
    expect(result.dealStageProgressMetrics).toBeDefined();
    expect(result.coachingPriorityRanking).toBeDefined();
    expect(result.anomalousMetrics).toBeDefined();
  });
});
