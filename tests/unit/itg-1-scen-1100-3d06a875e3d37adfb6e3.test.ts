import {
  notifyDashboardDataFreshnessWarning,
  NotificationSendFailure,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
  fetchUserPermissions: jest.fn(),
}));

const { fetchAllUsers, fetchUserPermissions } = require('../../src/logic/data-persistence');

describe('SCEN-1100: NotificationSendFailure エラー検証 - すべてのチャネル送信失敗', () => {
  it('すべての指定チャネルで送信に失敗した場合、NotificationSendFailure エラーが発生する', async () => {
    // すべてのチャネル送信が失敗する状況をシミュレートするため、
    // fetchAllUsers と fetchUserPermissions が成功しても、
    // 実装内部の通知送信処理がすべて失敗するようにモック設定
    const mockUsers = [
      {
        userId: 'user-sales-mgr-001',
        name: '山田太郎',
        role: '営業部長',
        isActive: true,
      },
    ];

    const mockPermissions = {
      userId: 'user-sales-mgr-001',
      enabledChannels: ['email', 'sms', 'in_app'],
      emailAddress: 'yamada.taro@company.com',
      phoneNumber: '+81-90-XXXX-XXXX',
    };

    fetchAllUsers.mockResolvedValue(mockUsers);
    fetchUserPermissions.mockResolvedValue(mockPermissions);

    const input = {
      dashboardDataFreshnessStatus: {
        activityMetricsLastUpdatedAt: new Date('2025-01-07T14:00:00Z'),
        dealStageProgressLastUpdatedAt: new Date('2025-01-07T14:00:00Z'),
        targetAchievementDifferenceLastUpdatedAt: new Date('2025-01-07T14:00:00Z'),
        anomalyDetectionLogLastUpdatedAt: new Date('2025-01-07T14:00:00Z'),
        invoiceStatusClassificationLastUpdatedAt: new Date('2025-01-07T14:00:00Z'),
        invoiceDelayDetectionLastUpdatedAt: new Date('2025-01-07T14:00:00Z'),
        dataflowAnomaliesLastUpdatedAt: new Date('2025-01-07T14:00:00Z'),
      },
      currentDateTime: new Date('2025-01-10T18:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'immediate' as const,
    };

    // 仕様では外部サービス障害によりすべてのチャネルで送信失敗し、
    // NotificationSendFailure エラーが発生することを期待
    await expect(notifyDashboardDataFreshnessWarning(input)).rejects.toThrow(
      NotificationSendFailure
    );
  });
});
