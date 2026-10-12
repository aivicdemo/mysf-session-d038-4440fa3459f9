import {
  notifyDashboardDataIntegrityWarning,
  NotifyDashboardDataIntegrityWarningOutput,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

const { fetchAllUsers } = require('../../src/logic/data-persistence');

describe('SCEN-1104: データ不整合警告 - すべてのチャネルで成功', () => {
  it('営業部長が存在し全ての指定チャネルで連絡先が登録されている場合、全チャネルで警告通知を送信し成功応答を返す', async () => {
    const mockUsers = [
      {
        userId: 'user-sales-manager-001',
        userName: '営業部長 太郎',
        role: 'sales_manager',
        email: 'manager@company.com',
        phoneNumber: '+81-90-1234-5678',
        inAppNotificationEnabled: true,
      },
    ];

    fetchAllUsers.mockResolvedValue(mockUsers);

    const input = {
      integrityWarningDetails: {
        dataInconsistencies: [
          {
            sourceDataType: 'dealStageProgress' as const,
            inconsistencyType: 'amount_mismatch' as const,
            affectedRecordCount: 3,
            description: '商談金額と請求金額が不一致',
          },
        ],
        missingCriticalData: [
          {
            dataType: 'invoiceStatusClassification' as const,
            missingRecordCount: 5,
            description: '請求ステータスが未分類のレコード',
          },
        ],
        overallSeverity: 'high' as const,
      },
      currentDateTime: new Date('2026-10-07T14:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    const result: NotifyDashboardDataIntegrityWarningOutput =
      await notifyDashboardDataIntegrityWarning(input);

    expect(result.notificationId).toBeDefined();
    expect(result.salesManagerUserId).toBe('user-sales-manager-001');
    expect(result.salesManagerName).toBe('営業部長 太郎');
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentAt).toEqual(new Date('2026-10-07T14:30:00Z'));
    expect(result.integrityWarningDetails).toEqual(input.integrityWarningDetails);
    expect(result.failedChannels).toBeUndefined();
  });
});
