import { notifyDashboardResponseDelay } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1121: 通知送信日時が入力の現在日時で出力に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record notification sent time exactly as input currentDateTime', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: [
        {
          userId: 'user-12345',
          loginId: 'tanaka-taro',
          userName: 'Tanaka Taro',
          emailAddress: 'tanaka.taro@example.com',
          phoneNumber: '+81-90-1234-5678',
          role: 'sales_representative',
          salesRepresentativeId: 'sales-002',
          validFlag: true,
          lastLoginDateTime: '2026-10-07T10:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-10-07T10:00:00Z',
          createdBy: 'admin',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-07T14:30:45.123Z',
    });

    const currentDateTime = new Date('2026-10-07T14:30:45.123Z');

    const input = {
      requestingUserId: 'user-12345',
      actualResponseTimeSeconds: 35,
      dashboardResponseTimeoutThresholdSeconds: 30,
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      currentDateTime,
    };

    const result = await notifyDashboardResponseDelay(input);

    expect(result.sentAt).toEqual(new Date('2026-10-07T14:30:45.123Z'));
    expect(result.sentAt.getTime()).toBe(currentDateTime.getTime());

    expect(result.notificationId).toBeTruthy();
    expect(result.requestingUserId).toBe('user-12345');
    expect(result.requestingUserName).toBe('Tanaka Taro');

    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.delayDurationSeconds).toBe(5);

    expect(result.fallbackDisplayProvided).toBe(true);
    expect(['cached', 'simplified']).toContain(result.fallbackDisplayType);

    expect(!result.failedChannels || result.failedChannels.length === 0).toBe(true);
  });
});
