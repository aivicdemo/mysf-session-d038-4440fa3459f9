import { notifyDashboardResponseDelay } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1118: 複数の通知チャネルが指定されている場合、一部だけ送信に失敗したとき、送信成功したチャネルのみが出力に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record only successfully sent channels when some channels fail', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: [
        {
          userId: 'user-001',
          loginId: 'taro',
          userName: '営業太郎',
          emailAddress: 'taro@example.com',
          phoneNumber: '+81-90-1234-5678',
          role: 'sales_representative',
          salesRepresentativeId: 'sales-001',
          validFlag: true,
          lastLoginDateTime: '2026-10-07T10:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-10-07T10:00:00Z',
          createdBy: 'admin',
        },
      ],
      totalCount: 1,
      fetchedAt: '2026-10-07T10:30:00Z',
    });

    const input = {
      requestingUserId: 'user-001',
      actualResponseTimeSeconds: 35,
      dashboardResponseTimeoutThresholdSeconds: 30,
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
    };

    const result = await notifyDashboardResponseDelay(input);

    expect(result.notificationId).toBeTruthy();
    expect(typeof result.notificationId).toBe('string');
    expect(result.notificationId.length).toBeGreaterThan(0);

    expect(result.requestingUserId).toBe('user-001');
    expect(result.requestingUserName).toBe('営業太郎');

    expect(result.sentChannels).toEqual(expect.arrayContaining(['email', 'in_app']));
    expect(result.sentChannels).not.toContain('sms');

    expect(result.sentAt).toEqual(new Date('2026-10-07T10:30:00Z'));
    expect(result.delayDurationSeconds).toBe(5);

    expect(result.fallbackDisplayProvided).toBe(true);
    expect(result.fallbackDisplayType).toBe('cached');

    expect(result.failedChannels).toEqual(['sms']);
  });
});
