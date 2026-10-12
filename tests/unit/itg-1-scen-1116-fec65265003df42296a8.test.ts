import { notifyDashboardResponseDelay, NotificationChannelDeliveryFailure } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence.ts');

const mockDataPersistence = require('../../src/logic/data-persistence.ts');

describe('SCEN-1116: Notification channel delivery failure - NotificationChannelDeliveryFailure error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise NotificationChannelDeliveryFailure error when email channel fails', async () => {
    const requestingUserId = 'user-12345';
    const actualResponseTimeSeconds = 35;
    const dashboardResponseTimeoutThresholdSeconds = 30;
    const notificationChannels = ['email', 'sms', 'in_app'] as const;
    const currentDateTime = new Date('2026-10-07T10:30:00.000Z');

    const userInfo = [
      {
        requestingUserId: 'user-12345',
        requestingUserName: '田中太郎',
        email: 'tanaka@example.com',
        phoneNumber: '+81-90-1234-5678',
      },
    ];

    mockDataPersistence.fetchAllUsers = jest.fn().mockResolvedValue(userInfo);

    let error: any = null;
    try {
      await notifyDashboardResponseDelay({
        requestingUserId,
        actualResponseTimeSeconds,
        dashboardResponseTimeoutThresholdSeconds,
        notificationChannels: Array.from(notificationChannels),
        currentDateTime,
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(NotificationChannelDeliveryFailure);
    expect(error.message).toContain('遅延通知の送信に失敗しました');
  });
});
