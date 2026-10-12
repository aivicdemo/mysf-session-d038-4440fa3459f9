import {
  notifyDashboardDataIntegrityWarning,
  InvalidNotificationChannels,
} from '../../src/logic/notification-service';

describe('SCEN-1106: InvalidNotificationChannels エラー - 空配列指定', () => {
  it('通知チャネルが空配列または無効な値を含む場合、InvalidNotificationChannels エラーを発生させる', async () => {
    const input = {
      integrityWarningDetails: {
        dataInconsistencies: [
          {
            sourceDataType: 'invoiceStatusClassification' as const,
            inconsistencyType: 'status_mismatch' as const,
            affectedRecordCount: 5,
            description:
              '請求ステータスが請求書マスタと請求明細で不一致',
          },
        ],
        missingCriticalData: [],
        overallSeverity: 'high' as const,
      },
      currentDateTime: new Date('2026-10-10T14:30:00.000Z'),
      notificationChannels: [] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    await expect(notifyDashboardDataIntegrityWarning(input)).rejects.toThrow(
      InvalidNotificationChannels
    );
  });
});
