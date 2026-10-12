import {
  notifyDashboardDataFreshnessWarning,
  NotificationChannelUnavailable,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

const { fetchAllUsers, fetchUserPermissions } = require('../../src/logic/data-persistence');

describe('SCEN-1099: NotificationChannelUnavailable エラー検証', () => {
  it('指定された通知チャネルが営業部長の設定で無効化されており、利用可能なチャネルがない場合、NotificationChannelUnavailable エラーが発生する', async () => {
    const mockUsers = [
      {
        userId: 'sales-mgr-001',
        name: '山田太郎',
        role: 'sales_manager',
        active: true,
      },
    ];

    const mockPermissions = {
      userId: 'sales-mgr-001',
      notificationPermissions: {
        email: false,
        sms: false,
        in_app: false,
      },
    };

    fetchAllUsers.mockResolvedValue(mockUsers);
    fetchUserPermissions.mockResolvedValue(mockPermissions);

    const input = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2025-01-15T08:00:00Z'),
        dealStageProgressLastUpdatedAt: new Date('2025-01-15T08:05:00Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2025-01-15T08:10:00Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2025-01-15T08:15:00Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2025-01-15T08:20:00Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2025-01-14T16:00:00Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2025-01-15T08:25:00Z'),
      } as const,
      currentDateTime: new Date('2025-01-15T10:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    await expect(notifyDashboardDataFreshnessWarning(input)).rejects.toThrow(
      NotificationChannelUnavailable
    );
  });
});
