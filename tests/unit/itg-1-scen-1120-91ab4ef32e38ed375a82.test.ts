import { notifyDashboardResponseDelay } from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-1120: キャッシュされたダッシュボードデータが利用不可の場合、代替表示が『簡易版』として提供される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide simplified fallback display when cached dashboard data is unavailable', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue({
      users: [],
      totalCount: 0,
      fetchedAt: '2026-10-07T10:30:00Z',
    });

    const input = {
      requestingUserId: 'user-12345',
      actualResponseTimeSeconds: 35,
      dashboardResponseTimeoutThresholdSeconds: 30,
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
    };

    const result = await notifyDashboardResponseDelay(input);

    expect(result.notificationId).toBeTruthy();
    expect(typeof result.notificationId).toBe('string');
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.notificationId)).toBe(true);

    expect(result.requestingUserId).toBe('user-12345');

    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('in_app');

    expect(result.sentAt).toEqual(new Date('2026-10-07T10:30:00Z'));

    expect(result.delayDurationSeconds).toBe(5);

    expect(result.fallbackDisplayProvided).toBe(true);
    expect(result.fallbackDisplayType).toBe('simplified');

    expect(!result.failedChannels || result.failedChannels.length === 0).toBe(true);
  });
});
