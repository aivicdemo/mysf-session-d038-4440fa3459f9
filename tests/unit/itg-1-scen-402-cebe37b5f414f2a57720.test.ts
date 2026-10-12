import { aggregateSalesPerformanceForDashboard, InsufficientPermission } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-402: InsufficientPermission error when user lacks dashboard view permission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InsufficientPermission error when fetchUserPermissions returns dashboardAccessLevel "none"', async () => {
    const input = {
      targetPeriod: '2024-11',
      currentDate: new Date('2024-11-15T10:30:00Z'),
      requestingUserId: 'user-001',
    };

    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValueOnce({
      userId: 'user-001',
      permissions: ['sales_view', 'report_create'],
      dashboardAccessLevel: 'none',
    });

    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(InsufficientPermission);
    await expect(aggregateSalesPerformanceForDashboard(input)).rejects.toThrow(
      'ダッシュボード表示権限がありません。'
    );
  });
});
