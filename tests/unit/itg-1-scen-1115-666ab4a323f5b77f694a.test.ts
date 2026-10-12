import { notifyDashboardResponseDelay, DashboardResponseTimeoutExceeded } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence.ts');

const mockDataPersistence = require('../../src/logic/data-persistence.ts');

describe('SCEN-1115: Dashboard response time exceeds threshold - DashboardResponseTimeoutExceeded error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise DashboardResponseTimeoutExceeded error and calculate delay duration', async () => {
    const requestingUserId = 'user-001';
    const actualResponseTimeSeconds = 35;
    const dashboardResponseTimeoutThresholdSeconds = 30;
    const notificationChannels = ['email', 'in_app'] as const;
    const currentDateTime = new Date('2026-10-07T10:30:00Z');

    const userInfo = [
      {
        requestingUserId: 'user-001',
        requestingUserName: '山田太郎',
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

    expect(error).toBeInstanceOf(DashboardResponseTimeoutExceeded);
    expect(error.message).toContain('ダッシュボード表示の応答時間が閾値を超過しました');
  });
});
