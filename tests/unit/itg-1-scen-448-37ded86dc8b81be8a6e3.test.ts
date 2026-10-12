import { aggregateSalesPerformanceForDashboard, NoSalesRepresentativesFound } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-448: NoSalesRepresentativesFound error handling', () => {
  const mockDataPersistence = dataPersistence as jest.Mocked<typeof dataPersistence>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoSalesRepresentativesFound error when sales representatives list is empty', async () => {
    const targetPeriod = '2024-11';
    const currentDate = new Date('2024-11-15T10:30:00Z');
    const requestingUserId = 'user-001';

    // Empty sales representatives
    (mockDataPersistence.fetchAllSalesRepresentatives as jest.Mock) = jest.fn().mockResolvedValue([]);

    (mockDataPersistence.fetchActivitiesByRepresentative as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', activity_date: '2024-11-10', activity_type: '訪問', activity_id: 'act-001' },
      { rep_id: 'rep-002', activity_date: '2024-11-12', activity_type: '電話', activity_id: 'act-002' },
    ]);

    (mockDataPersistence.fetchDealsForPeriod as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', deal_id: 'deal-001', deal_stage: 'stage-002', deal_amount: 1000000, deal_status: '進行中' },
    ]);

    (mockDataPersistence.fetchSalesTargets as jest.Mock) = jest.fn().mockResolvedValue([
      { rep_id: 'rep-001', target_period: '2024-11', target_activity_count: 10, target_deal_amount: 5000000 },
    ]);

    (mockDataPersistence.fetchAllDealStages as jest.Mock) = jest.fn().mockResolvedValue([
      { stage_id: 'stage-001', stage_name: '初期接触' },
      { stage_id: 'stage-002', stage_name: '提案' },
    ]);

    (mockDataPersistence.fetchUserPermissions as jest.Mock) = jest.fn().mockResolvedValue({
      user_id: 'user-001',
      can_view_dashboard: true,
      accessible_departments: ['dept-001'],
    });

    // Should throw NoSalesRepresentativesFound error
    await expect(
      aggregateSalesPerformanceForDashboard({
        targetPeriod,
        currentDate,
        requestingUserId,
      })
    ).rejects.toThrow(NoSalesRepresentativesFound);
  });
});
