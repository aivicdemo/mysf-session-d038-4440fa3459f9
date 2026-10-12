import { notifyDashboardResponseDelay } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence.ts');

const mockDataPersistence = require('../../src/logic/data-persistence.ts');

describe('SCEN-1112: Dashboard delay notification with cached fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send delay notification and provide cached fallback when response time exceeds threshold', async () => {
    const requestingUserId = 'user-12345';
    const actualResponseTimeSeconds = 35;
    const dashboardResponseTimeoutThresholdSeconds = 30;
    const notificationChannels = ['email', 'sms', 'in_app'] as const;
    const currentDateTime = new Date('2026-10-07T10:30:00Z');

    const userInfo = [
      {
        id: 'user-12345',
        name: 'Tanaka Taro',
        contactEmail: 'tanaka.taro@example.com',
        contactPhone: '+81-90-1234-5678',
      },
    ];

    mockDataPersistence.fetchAllUsers = jest.fn().mockResolvedValue(userInfo);

    const result = await notifyDashboardResponseDelay({
      requestingUserId,
      actualResponseTimeSeconds,
      dashboardResponseTimeoutThresholdSeconds,
      notificationChannels: Array.from(notificationChannels),
      currentDateTime,
    });

    expect(result.notificationId).toBeTruthy();
    expect(result.requestingUserId).toBe('user-12345');
    expect(result.requestingUserName).toBe('Tanaka Taro');
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentAt.getTime()).toBeGreaterThanOrEqual(currentDateTime.getTime());
    expect(result.delayDurationSeconds).toBe(5);
    expect(result.fallbackDisplayProvided).toBe(true);
    expect(result.fallbackDisplayType).toBe('cached');
    expect(result.failedChannels).toBeUndefined();
  });
});
