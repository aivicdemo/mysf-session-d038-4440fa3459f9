import { notifyDashboardResponseDelay } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence.ts');

const mockDataPersistence = require('../../src/logic/data-persistence.ts');

describe('SCEN-1114: Dashboard response time equals threshold - delay is detected', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should determine delay when response time equals threshold', async () => {
    const requestingUserId = 'user-001';
    const actualResponseTimeSeconds = 30;
    const dashboardResponseTimeoutThresholdSeconds = 30;
    const notificationChannels = ['email', 'sms', 'in_app'] as const;
    const currentDateTime = new Date('2026-10-07T10:30:00.000Z');

    const userInfo = [
      {
        requestingUserId: 'user-001',
        requestingUserName: '田中太郎',
        email: 'tanaka@example.com',
        phone: '+81-90-0000-0001',
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
    expect(result.notificationId).toBeTruthy();
    expect(result.requestingUserId).toBe('user-001');
    expect(result.requestingUserName).toBe('田中太郎');
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentAt.getTime()).toBeGreaterThanOrEqual(currentDateTime.getTime());
    expect(result.delayDurationSeconds).toBe(0);
    expect(result.fallbackDisplayProvided).toBe(true);
    expect(result.fallbackDisplayType).toBe('cached');
    expect(result.failedChannels).toBeUndefined();
  });
});
