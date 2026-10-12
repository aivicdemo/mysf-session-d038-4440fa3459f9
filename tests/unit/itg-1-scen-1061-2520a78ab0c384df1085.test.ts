import { notifyIssueReport, NotifyIssueReportInput } from '../../src/logic/notification-service';

describe('SCEN-1061: 複数の通知チャネルが指定されている場合、selectNotificationChannel の戻り値に基づいて各受信者に適切なチャネルで配信する', () => {
  it('各受信者に対して selectNotificationChannel の結果に基づいて配信', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: 'DEAL-20250107-001',
        invoiceId: 'INV-2025-00456',
        amount: 1500000,
        delayDays: 5,
        reason: '請求書未発行',
        additionalNotes: '営業担当者が請求漏れを発見'
      },
      reportingRepresentativeId: 'REP-USER-0089',
      reportTimestamp: new Date('2025-01-07T14:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    const result = await notifyIssueReport(input);

    expect(result.recipientCount).toBe(3);
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentRecipients).toHaveLength(3);
    expect(result.sentRecipients[0]).toMatchObject({
      userId: 'ACC-USER-0001',
      userName: '田中太郎',
      role: 'accounting_manager',
      channel: 'email'
    });
    expect(result.sentRecipients[1]).toMatchObject({
      userId: 'ACC-USER-0002',
      userName: '佐藤花子',
      role: 'billing_specialist',
      channel: 'sms'
    });
    expect(result.sentRecipients[2]).toMatchObject({
      userId: 'ACC-USER-0003',
      userName: '鈴木次郎',
      role: 'billing_specialist',
      channel: 'in_app'
    });
    expect(result.failedRecipients).toBeUndefined();
    expect(result.notificationId).toBeTruthy();
    expect(result.reportId).toBeTruthy();
  });
});
