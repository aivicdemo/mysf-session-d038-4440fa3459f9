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

describe('SCEN-1103: 営業部長の一部チャネル設定で有効なチャネルのみ送信', () => {
  it('営業部長の通知チャネル設定に一部のみ有効なチャネルが含まれている場合、有効なチャネルのみで通知を送信し、sentChannels に実際に送信したチャネルだけを含めて出力を返す', async () => {
    const mockUsers = [
      {
        userId: 'user-sales-mgr-001',
        name: '田中営業部長',
        role: 'sales_manager',
        enabled: true,
      },
    ];

    const mockPermissions = {
      fetchUserPermissions戻り値: {
        userId: 'user-sales-mgr-001',
        notificationChannels: {
          email: true,
          sms: false,
          in_app: true,
        },
      },
    };

    fetchAllUsers.mockResolvedValue({
      fetchAllUsers戻り値: mockUsers,
    });

    fetchUserPermissions.mockResolvedValue(mockPermissions);

    const input = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2025-01-15T08:00:00Z'),
        dealStageProgressLastUpdatedAt: new Date('2025-01-15T07:30:00Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2025-01-14T10:00:00Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2025-01-15T08:15:00Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2025-01-15T06:00:00Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2025-01-13T14:00:00Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2025-01-15T07:45:00Z'),
      },
      currentDateTime: new Date('2025-01-15T10:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    const result: NotifyDashboardDataFreshnessWarningOutput =
      await notifyDashboardDataFreshnessWarning(input);

    expect(result.notificationId).toBeDefined();
    expect(result.salesManagerUserId).toBe('user-sales-mgr-001');
    expect(result.salesManagerName).toBe('田中営業部長');
    // email と in_app のみが有効なので、この 2 つのチャネルのみに送信
    expect(result.sentChannels).toEqual(expect.arrayContaining(['email', 'in_app']));
    expect(result.sentChannels).not.toContain('sms');
    expect(result.sentChannels.length).toBe(2);
    // invoiceDelayDetectionLastUpdatedAt (2025-01-13T14:00:00Z) が最も古い
    // currentDateTime (2025-01-15T10:00:00Z) からの経過時間: 1620 分 (27 時間)
    expect(result.freshnessWarningDetails.maxStalenessMinutes).toBe(1620);
    expect(result.freshnessWarningDetails.staleDataTypes).toContain(
      'invoiceDelayDetection'
    );
    expect(result.failedChannels).toBeUndefined();
  });
});
