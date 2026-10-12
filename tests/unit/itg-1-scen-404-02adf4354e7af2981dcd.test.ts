import { aggregateSalesPerformanceForDashboard, DealStageDefinitionMissing } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-404: DealStageDefinitionMissing error when deal stages are empty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealStageDefinitionMissing error when fetchAllDealStages returns empty array', async () => {
    const input = {
      targetPeriod: '2024-10',
      currentDate: new Date('2024-10-15T10:00:00Z'),
      requestingUserId: 'user-001',
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValueOnce([
      { representativeId: 'rep-001', representativeName: '営業太郎', department: '営業部' },
    ]);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValueOnce([
      { representativeId: 'rep-001', activityId: 'act-001', activityType: '訪問', activityDate: '2024-10-05T14:00:00Z' },
    ]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValueOnce([
      { dealId: 'deal-001', representativeId: 'rep-001', dealAmount: 1000000, dealStageId: 'stage-001', dealStatus: 'active' },
    ]);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValueOnce([
      { representativeId: 'rep-001', targetPeriod: '2024-10', targetAmount: 5000000, targetActivityCount: 20 },
    ]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValueOnce([]);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValueOnce({
      userId: 'user-001',
      canViewDashboard: true,
      accessibleDepartments: ['営業部'],
    });

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(DealStageDefinitionMissing);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '商談ステージ定義が不完全です。ステージ別進捗集計ができません。'
    );
  });
});
