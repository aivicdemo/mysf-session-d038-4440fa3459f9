import { aggregateSalesPerformanceForDashboard, NoSalesRepresentativesFound } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-400: NoSalesRepresentativesFound error when no sales representatives exist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoSalesRepresentativesFound error when fetchAllSalesRepresentatives returns empty array', async () => {
    const input = {
      targetPeriod: '2024-01',
      currentDate: new Date('2024-01-15T10:30:00Z'),
      requestingUserId: 'user-sales-manager-001',
    };

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValueOnce([]);
    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValueOnce([]);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValueOnce([]);
    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValueOnce([]);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValueOnce([
      { stageId: 'stage-001', stageName: '初期接触' },
      { stageId: 'stage-002', stageName: '提案' },
    ]);
    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValueOnce({
      userId: 'user-sales-manager-001',
      canViewDashboard: true,
      accessLevel: 'manager',
    });

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(NoSalesRepresentativesFound);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      '営業担当者マスタが空です。ダッシュボード表示に必要なデータがありません。'
    );
  });
});
