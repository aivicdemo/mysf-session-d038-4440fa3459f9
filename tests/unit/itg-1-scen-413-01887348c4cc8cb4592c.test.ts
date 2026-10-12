import { aggregateSalesPerformanceForDashboard } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-413: aggregateSalesPerformanceForDashboard - error when monthly closing day is 0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when monthly closing day is 0 (invalid)', async () => {
    const targetPeriod = '2025-06';
    const currentDate = new Date('2025-06-15T10:30:00Z');
    const requestingUserId = 'user-001';

    const mockSalesReps = {
      salesRepresentatives: [
        { salesRepresentativeId: 'rep-001', name: '営業太郎', department: '営業部', emailAddress: 'taro@example.com', phoneNumber: null, jobTitle: null, supervisorId: null, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: null },
      ],
      totalCount: 1,
      fetchedAt: '2025-06-15T10:30:00Z',
    };

    const mockPermissions = {
      permissions: [
        { permissionId: 'perm-001', userId: 'user-001', permissionCode: 'DASHBOARD_VIEW', permissionName: 'ダッシュボード表示', description: null, validFlag: true, createdAt: '2024-01-01', updatedAt: '2024-01-01', createdBy: 'admin', updatedBy: 'admin' },
      ],
      totalCount: 1,
      fetchedAt: '2025-06-15T10:30:00Z',
    };

    jest.mocked(dataPersistence.fetchAllSalesRepresentatives).mockResolvedValue(mockSalesReps);
    jest.mocked(dataPersistence.fetchUserPermissions).mockResolvedValue(mockPermissions);

    // Mock to simulate invalid monthly closing day configuration
    jest.mocked(dataPersistence.fetchActivitiesByRepresentative).mockImplementation(() => {
      const error = new Error('月次締め日の設定が不正です。1～31の値を指定してください。');
      error.name = 'InvalidConfigurationError';
      return Promise.reject(error);
    });

    await expect(
      aggregateSalesPerformanceForDashboard({
        targetPeriod,
        currentDate,
        requestingUserId,
      })
    ).rejects.toThrow('月次締め日の設定が不正です。1～31の値を指定してください。');
  });
});
