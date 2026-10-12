import { notifyIssueReport, NotificationDeliveryFailure, NotifyIssueReportInput } from '../../src/logic/notification-service';

describe('SCEN-1058: 通知送信処理中に外部サービスが応答しない場合、NotificationDeliveryFailure エラーを返す', () => {
  it('通知送信処理中に外部サービスが応答しない場合、NotificationDeliveryFailure エラーを発生させる', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: 'DEAL-20250107-001',
        invoiceId: 'INV-2025-00123',
        amount: 500000,
        delayDays: 7,
        reason: '請求書未送付',
        additionalNotes: '顧客からの問い合わせあり',
      },
      reportingRepresentativeId: 'USER-REP-001',
      reportTimestamp: new Date('2025-01-07T10:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    await expect(notifyIssueReport(input)).rejects.toThrow(NotificationDeliveryFailure);
    await expect(notifyIssueReport(input)).rejects.toThrow('通知の送信に失敗しました。しばらく後に再度お試しください。');
  });
});
