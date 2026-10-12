import {
  notifyDashboardDataIntegrityWarning,
  SalesManagerNotFound,
} from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllUsers: jest.fn(),
}));

const { fetchAllUsers } = require('../../src/logic/data-persistence');

describe('SCEN-1105: SalesManagerNotFound エラー - 営業部長ユーザーなし', () => {
  it('営業部長ロールのユーザーが存在しない場合、SalesManagerNotFound エラーを発生させる', async () => {
    // 営業部長ロールのユーザーが 0 件
    fetchAllUsers.mockResolvedValue([]);

    const input = {
      integrityWarningDetails: {
        dataInconsistencies: [
          {
            sourceDataType: 'invoiceStatusClassification' as const,
            inconsistencyType: 'status_mismatch' as const,
            affectedRecordCount: 5,
            description: '請求ステータスと実績データの不整合を検出',
          },
        ],
        missingCriticalData: [],
        overallSeverity: 'high' as const,
      },
      currentDateTime: new Date('2026-10-15T14:30:00Z'),
      notificationChannels: ['email', 'sms'] as Array<'email' | 'sms'>,
      urgencyLevel: 'high' as const,
    };

    await expect(notifyDashboardDataIntegrityWarning(input)).rejects.toThrow(
      SalesManagerNotFound
    );
  });
});
