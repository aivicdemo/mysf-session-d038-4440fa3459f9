import { notifyIssueReport, NotificationChannelUnavailable, NotifyIssueReportInput } from '../../src/logic/notification-service';

describe('SCEN-1057: 指定された通知チャネルがすべて利用不可の場合、NotificationChannelUnavailable エラーで拒否する', () => {
  it('指定された通知チャネルがすべて利用不可の場合、NotificationChannelUnavailable エラーを発生させる', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: 'DEAL-001',
        invoiceId: 'INV-2025-001',
        amount: 500000,
        delayDays: 15,
        reason: '請求書未発行',
        additionalNotes: '営業側で請求手続きが遅れた',
      },
      reportingRepresentativeId: 'REP-12345',
      reportTimestamp: new Date('2025-01-15T10:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    await expect(notifyIssueReport(input)).rejects.toThrow(NotificationChannelUnavailable);
    await expect(notifyIssueReport(input)).rejects.toThrow('指定された通知チャネルが利用できません。別のチャネルを選択してください。');
  });
});
