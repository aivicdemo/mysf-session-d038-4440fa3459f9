import { notifyIssueReport, NotifyIssueReportInput } from '../../src/logic/notification-service';

describe('SCEN-1063: 通知が複数の受信者に正常に配信された場合、sentChannels に実際に使用されたすべてのチャネルのユニークなリストを返す', () => {
  it('複数チャネルの使用状況を正確に sentChannels に反映', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: 'DEAL-2024-001',
        invoiceId: 'INV-2024-0001',
        amount: 150000,
        delayDays: 5,
        reason: '請求書が発行されていない',
        additionalNotes: '取引先へ確認済み'
      },
      reportingRepresentativeId: 'REP-001',
      reportTimestamp: new Date('2024-01-15T10:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    const result = await notifyIssueReport(input);

    expect(result.recipientCount).toBe(3);
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentChannels).toHaveLength(3);
    expect(result.sentRecipients).toHaveLength(5);
    expect(result.sentRecipients[0]).toMatchObject({
      userId: 'ACC-001',
      channel: 'email'
    });
    expect(result.sentRecipients[1]).toMatchObject({
      userId: 'ACC-001',
      channel: 'sms'
    });
    expect(result.sentRecipients[2]).toMatchObject({
      userId: 'ACC-002',
      channel: 'email'
    });
    expect(result.sentRecipients[3]).toMatchObject({
      userId: 'ACC-002',
      channel: 'in_app'
    });
    expect(result.sentRecipients[4]).toMatchObject({
      userId: 'ACC-003',
      channel: 'email'
    });
    expect(result.failedRecipients).toBeUndefined();
    expect(result.notificationId).toBeTruthy();
    expect(result.reportId).toBeTruthy();
  });
});
