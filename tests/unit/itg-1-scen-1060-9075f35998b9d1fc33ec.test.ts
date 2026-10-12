import { notifyIssueReport, NotifyIssueReportInput, NotifyIssueReportOutput } from '../../src/logic/notification-service';

describe('SCEN-1060: 緊急度が immediate の場合、指定チャネルの優先順位に従って複数の受信者に順序立てて通知を送信する', () => {
  it('複数受信者に優先度順に複数チャネルで通知を送信', async () => {
    const input: NotifyIssueReportInput = {
      reportContent: {
        dealId: 'DEAL-20240115-001',
        invoiceId: 'INV-2024-00567',
        amount: 1500000,
        delayDays: 5,
        reason: '請求書未送付',
        additionalNotes: '顧客承認待ちで遅延'
      },
      reportingRepresentativeId: 'REP-USER-2024-001',
      reportTimestamp: new Date('2024-01-15T14:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'immediate' as const
    };

    const result = await notifyIssueReport(input);

    expect(result.recipientCount).toBe(3);
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentRecipients).toHaveLength(6);

    expect(result.sentRecipients[0]).toEqual(
      expect.objectContaining({
        userId: 'ACC-USER-001',
        userName: '田中太郎',
        role: 'accounting_manager',
        channel: 'email',
        sentAt: expect.any(Date)
      })
    );
    expect(result.sentRecipients[1]).toEqual(
      expect.objectContaining({
        userId: 'ACC-USER-001',
        channel: 'sms'
      })
    );
    expect(result.sentRecipients[2]).toEqual(
      expect.objectContaining({
        userId: 'ACC-USER-002',
        channel: 'email'
      })
    );
    expect(result.sentRecipients[3]).toEqual(
      expect.objectContaining({
        userId: 'ACC-USER-002',
        channel: 'in_app'
      })
    );
    expect(result.sentRecipients[4]).toEqual(
      expect.objectContaining({
        userId: 'ACC-USER-003',
        channel: 'in_app'
      })
    );
    expect(result.sentRecipients[5]).toEqual(
      expect.objectContaining({
        userId: 'ACC-USER-003',
        channel: 'sms'
      })
    );

    expect(result.failedRecipients).toBeUndefined();
    expect(result.notificationId).toBeTruthy();
    expect(result.reportId).toBeTruthy();
  });
});
