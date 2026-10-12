import {
  notifyDashboardDataIntegrityWarning,
  NotifyDashboardDataIntegrityWarningOutput,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

const { fetchAllUsers } = require('../../src/logic/data-persistence');

describe('SCEN-1108: 通知送信の部分失敗 - failedChannels に記録', () => {
  it('通知送信処理が失敗した場合、NotificationSendFailure エラーを発生させるか失敗チャネルを failedChannels に記録して返す', async () => {
    const mockUsers = [
      {
        userId: 'user-001',
        name: '山田太郎',
        role: 'sales_manager',
        email: 'yamada@company.com',
        phone: '09012345678',
      },
    ];

    fetchAllUsers.mockResolvedValue(mockUsers);

    const input = {
      integrityWarningDetails: {
        dataInconsistencies: [
          {
            sourceDataType: 'invoiceStatusClassification' as const,
            inconsistencyType: 'amount_mismatch' as const,
            affectedRecordCount: 5,
            description: '請求金額と売上金額に不一致あり',
          },
        ],
        missingCriticalData: [
          {
            dataType: 'activityMetrics' as const,
            missingRecordCount: 3,
            description: '営業活動メトリクスが欠落',
          },
        ],
        overallSeverity: 'high' as const,
      },
      currentDateTime: new Date('2026-10-07T10:30:00.000Z'),
      notificationChannels: ['email', 'sms'] as Array<'email' | 'sms'>,
      urgencyLevel: 'high' as const,
    };

    const result: NotifyDashboardDataIntegrityWarningOutput =
      await notifyDashboardDataIntegrityWarning(input);

    expect(result.notificationId).toBeDefined();
    expect(result.salesManagerUserId).toBe('user-001');
    expect(result.salesManagerName).toBe('山田太郎');
    expect(result.sentChannels).toEqual(['email']);
    expect(result.failedChannels).toEqual(['sms']);
    expect(result.sentAt).toBeDefined();
    expect(result.integrityWarningDetails).toEqual(input.integrityWarningDetails);
  });
});
