import { notifyDashboardResponseDelay } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence.ts');

const mockDataPersistence = require('../../src/logic/data-persistence.ts');

describe('SCEN-1113: Dashboard response time below threshold - no delay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not determine delay when response time is below threshold', async () => {
    const requestingUserId = 'user-001';
    const actualResponseTimeSeconds = 25;
    const dashboardResponseTimeoutThresholdSeconds = 30;
    const notificationChannels = ['email', 'in_app'] as const;
    const currentDateTime = new Date('2026-10-07T10:30:00Z');

    const userInfo = [
      {
        userId: 'user-001',
        userName: '営業太郎',
        email: 'taro@company.com',
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
    expect(result.requestingUserId).toBe('user-001');
    expect(result.requestingUserName).toBe('営業太郎');
    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.sentAt).toBeDefined();
    expect(result.delayDurationSeconds).toBe(0);
    expect(result.fallbackDisplayProvided).toBe(false);
    expect(result.fallbackDisplayType).toBe('none');
  });
});
