import { notifyIssueReport, NoAccountingRecipients, NotifyIssueReportInput } from '../../src/logic/notification-service';

describe('SCEN-1056: 経理・請求部門の対象者が存在しない場合、NoAccountingRecipients エラーで拒否する', () => {
  it('経理・請求部門の通知対象者が見つからない場合、NoAccountingRecipients エラーを発生させる', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: 'DEAL-20240115-001',
        invoiceId: 'INV-2024-0501',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未発行',
        additionalNotes: '顧客への納品完了済み',
      },
      reportingRepresentativeId: 'REP-00123',
      reportTimestamp: new Date('2024-01-15T10:30:00Z'),
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
    };

    await expect(notifyIssueReport(input)).rejects.toThrow(NoAccountingRecipients);
    await expect(notifyIssueReport(input)).rejects.toThrow('経理・請求部門の通知対象者が見つかりません。システム管理者に確認してください。');
  });
});
