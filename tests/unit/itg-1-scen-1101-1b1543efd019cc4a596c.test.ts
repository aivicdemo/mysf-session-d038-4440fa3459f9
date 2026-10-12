import {
  notifyDashboardDataFreshnessWarning,
  NotifyDashboardDataFreshnessWarningOutput,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

const { fetchAllUsers, fetchUserPermissions } = require('../../src/logic/data-persistence');

describe('SCEN-1101: 複数チャネル指定で一部失敗時の処理', () => {
  it('複数の通知チャネルが指定されており、一部のチャネルのみ送信に失敗した場合、成功したチャネルで通知を送信し、失敗したチャネルを failedChannels に記録して出力を返す', async () => {
    const mockUsers = [
      {
        id: 'sales_mgr_001',
        name: '山田太郎',
        role: '営業部長',
        active: true,
        email: 'yamada.taro@company.com',
      },
    ];

    const mockPermissions = {
      result: {
        userId: 'sales_mgr_001',
        enabledChannels: ['email', 'in_app'],
      },
    };

    fetchAllUsers.mockResolvedValue({
      result: mockUsers,
    });

    fetchUserPermissions.mockResolvedValue(mockPermissions);

    const input = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2025-01-15T08:00:00Z'),
        dealStageProgressLastUpdatedAt: new Date('2025-01-15T07:30:00Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2025-01-14T18:00:00Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2025-01-15T09:00:00Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2025-01-14T16:00:00Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2025-01-15T08:30:00Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2025-01-15T07:00:00Z'),
      },
      currentDateTime: new Date('2025-01-15T10:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    const result: NotifyDashboardDataFreshnessWarningOutput =
      await notifyDashboardDataFreshnessWarning(input);

    expect(result.notificationId).toBeDefined();
    expect(result.salesManagerUserId).toBe('sales_mgr_001');
    expect(result.salesManagerName).toBe('山田太郎');
    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.sentChannels).not.toContain('sms');
    expect(result.freshnessWarningDetails.staleDataTypes).toContain(
      'targetAchievementDifference'
    );
    expect(result.freshnessWarningDetails.staleDataTypes).toContain(
      'invoiceStatusClassification'
    );
    expect(result.freshnessWarningDetails.maxStalenessMinutes).toBe(960);
    expect(result.failedChannels).toEqual(['sms']);
  });
});
