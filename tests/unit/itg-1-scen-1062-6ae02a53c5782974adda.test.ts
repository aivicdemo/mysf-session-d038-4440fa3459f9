import { notifyIssueReport, NotifyIssueReportInput } from '../../src/logic/notification-service';

describe('SCEN-1062: 一部の受信者への通知配信に失敗した場合、成功した受信者を sentRecipients に、失敗した受信者と理由を failedRecipients に分けて返す', () => {
  it('成功・失敗した受信者を分けて返す', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: 'DEAL-20241215-001',
        invoiceId: 'INV-2024-00512',
        amount: 1500000,
        delayDays: 5,
        reason: '請求書未発行のまま商談がクローズされた',
        additionalNotes: '取引先側の契約書署名遅延が原因'
      },
      reportingRepresentativeId: 'REP-2024-00089',
      reportTimestamp: new Date('2024-12-15T14:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    const result = await notifyIssueReport(input);

    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toEqual(['email', 'sms']);
    expect(result.sentRecipients).toHaveLength(2);
    expect(result.sentRecipients[0]).toMatchObject({
      userId: 'ACC-2024-00201',
      userName: '山田太郎',
      role: 'accounting_manager',
      channel: 'email',
      sentAt: expect.any(Date)
    });
    expect(result.sentRecipients[1]).toMatchObject({
      userId: 'ACC-2024-00202',
      userName: '佐藤花子',
      role: 'billing_specialist',
      channel: 'sms',
      sentAt: expect.any(Date)
    });
    expect(result.failedRecipients).toBeDefined();
    expect(result.failedRecipients).toHaveLength(1);
    expect(result.failedRecipients?.[0]).toMatchObject({
      userId: 'ACC-2024-00203',
      userName: '鈴木次郎',
      reason: 'デバイスの通知設定が無効'
    });
    expect(result.notificationId).toBeTruthy();
    expect(result.reportId).toBeTruthy();
  });
});
