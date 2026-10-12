import { notifyIssueReport, InvalidReportContent, NotifyIssueReportInput } from '../../src/logic/notification-service';

describe('SCEN-1055: reportContent が dealId を欠いている場合、InvalidReportContent エラーで拒否する', () => {
  it('reportContent の dealId が空文字列の場合、InvalidReportContent エラーを発生させる', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: '',
        invoiceId: 'INV-20250107-001',
        amount: 150000,
        delayDays: 5,
        reason: '顧客の承認待ち',
        additionalNotes: '追加情報なし',
      },
      reportingRepresentativeId: 'REP-12345',
      reportTimestamp: new Date('2025-01-07T10:30:00Z'),
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
    };

    await expect(notifyIssueReport(input)).rejects.toThrow(InvalidReportContent);
    await expect(notifyIssueReport(input)).rejects.toThrow('報告内容が不完全です。商談ID、請求書ID、金額、遅延理由を確認してください。');
  });
});
