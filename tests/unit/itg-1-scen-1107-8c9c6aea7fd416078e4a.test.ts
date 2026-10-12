import {
  notifyDashboardDataIntegrityWarning,
  NoValidContactInformation,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

const { fetchAllUsers } = require('../../src/logic/data-persistence');

describe('SCEN-1107: NoValidContactInformation エラー - 営業部長の連絡先未登録', () => {
  it('営業部長のユーザー情報は存在するが指定チャネルに対応する連絡先が未登録の場合、NoValidContactInformation エラーを発生させる', async () => {
    const mockUsers = [
      {
        userId: 'SM-001',
        name: '山田太郎',
        role: 'sales_manager',
        email: null,
        phoneNumber: null,
      },
    ];

    fetchAllUsers.mockResolvedValue(mockUsers);

    const input = {
      integrityWarningDetails: {
        dataInconsistencies: [
          {
            sourceDataType: 'invoiceStatusClassification' as const,
            inconsistencyType: 'status_mismatch' as const,
            affectedRecordCount: 5,
            description: '請求ステータス分類の不整合が検出されました',
          },
        ],
        missingCriticalData: [
          {
            dataType: 'invoiceDelayDetection' as const,
            missingRecordCount: 3,
            description: '請求遅延検知データの欠落',
          },
        ],
        overallSeverity: 'high' as const,
      },
      currentDateTime: new Date('2026-10-15T14:30:00Z'),
      notificationChannels: ['email', 'sms'] as Array<'email' | 'sms'>,
      urgencyLevel: 'high' as const,
    };

    await expect(notifyDashboardDataIntegrityWarning(input)).rejects.toThrow(
      NoValidContactInformation
    );
  });
});
