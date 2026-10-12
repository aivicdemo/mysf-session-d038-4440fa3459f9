import {
  notifyDashboardResponseDelay,
  UserNotFound,
  type NotifyDashboardResponseDelayInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

describe('SCEN-1117: notifyDashboardResponseDelay - 要求ユーザーが存在しない場合', () => {
  it('UserNotFoundエラーが発生する', async () => {
    (dataPersistence.fetchAllUsers as jest.Mock).mockResolvedValue([]);

    const input: NotifyDashboardResponseDelayInput = {
      requestingUserId: 'user-nonexistent-12345',
      actualResponseTimeSeconds: 35,
      dashboardResponseTimeoutThresholdSeconds: 30,
      notificationChannels: ['email', 'in_app'],
      currentDateTime: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(notifyDashboardResponseDelay(input)).rejects.toThrow(UserNotFound);
    await expect(notifyDashboardResponseDelay(input)).rejects.toThrow(
      '通知対象ユーザーが見つかりません。'
    );
  });
});
