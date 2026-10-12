import { aggregateSalesPerformanceForDashboard, DealStageDefinitionMissing } from '../../src/logic/sales-performance-aggregation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
  fetchActivitiesByRepresentative: jest.fn(),
  fetchDealsForPeriod: jest.fn(),
  fetchSalesTargets: jest.fn(),
  fetchAllDealStages: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

describe('SCEN-449: aggregateSalesPerformanceForDashboard error handling for DealStageDefinitionMissing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealStageDefinitionMissing error when fetchAllDealStages returns null/empty stages', async () => {
    const targetPeriod = '2024-01';
    const currentDate = new Date('2024-01-15T10:30:00Z');
    const requestingUserId = 'user-001';

    const mockSalesRepresentatives = [
      {
        salesRepresentativeId: 'rep-001',
        name: '営業太郎',
        emailAddress: 'taro@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: null,
        supervisorId: null,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: null,
      },
    ];

    const mockActivities = [
      {
        activityId: 'act-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        activityType: '訪問',
        activityDateTime: '2024-01-10T10:00:00Z',
        activityContent: 'クライアント訪問',
        nextFollowUpScheduledDate: null,
        dealId: null,
        estimatedAmount: null,
        contractedFlag: false,
        activityDurationMinutes: 60,
        activityCount: 1,
        activityFrequency: '初回',
        activityResult: '成功',
        nextAction: null,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        createdBy: 'rep-001',
      },
    ];

    const mockDeals = [
      {
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'テスト商談',
        dealAmount: 100000,
        stageId: 'stage-001',
        expectedContractDate: '2024-02-01',
        contractedDate: null,
        description: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        createdBy: 'rep-001',
      },
    ];

    const mockSalesTargets = [
      {
        salesTargetId: 'target-001',
        salesRepresentativeId: 'rep-001',
        customerId: null,
        targetYearMonth: '2024-01',
        targetAmount: 500000,
        targetCount: 20,
        status: 'active',
        remarks: null,
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedAt: '2024-01-01T00:00:00Z',
        updatedBy: 'admin',
      },
    ];

    const mockUserPermissions = [
      {
        permissionId: 'perm-001',
        userId: 'user-001',
        permissionCode: 'dashboard_view',
        permissionName: 'ダッシュボード表示権限',
        description: null,
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: mockSalesRepresentatives,
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    (dataPersistence.fetchActivitiesByRepresentative as jest.Mock).mockResolvedValue({
      activities: mockActivities,
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({
      deals: mockDeals,
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    (dataPersistence.fetchSalesTargets as jest.Mock).mockResolvedValue({
      salesTargets: mockSalesTargets,
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    (dataPersistence.fetchUserPermissions as jest.Mock).mockResolvedValue({
      permissions: mockUserPermissions,
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
    });

    await expect(
      aggregateSalesPerformanceForDashboard({
        targetPeriod,
        currentDate,
        requestingUserId,
      })
    ).rejects.toThrow(DealStageDefinitionMissing);

    await expect(
      aggregateSalesPerformanceForDashboard({
        targetPeriod,
        currentDate,
        requestingUserId,
      })
    ).rejects.toMatchObject({
      name: 'DealStageDefinitionMissing',
      message: '商談ステージ定義が不完全です。ステージ別進捗集計ができません。',
    });
  });
});
