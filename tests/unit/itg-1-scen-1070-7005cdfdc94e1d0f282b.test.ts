import { notifyIssueResponse, PartialNotificationFailure, NotifyIssueResponseInput } from '../../src/logic/notification-service';

describe('SCEN-1070: 複数チャネルが指定された場合に一部のチャネルへの送信に失敗した場合、PartialNotificationFailure エラーを返す', () => {
  it('一部チャネル失敗時に PartialNotificationFailure を throw し、部分的な送信結果を返す', async () => {
    const input: NotifyIssueResponseInput = {
      issueContext: {
        dealId: 'DEAL-2024-001',
        invoiceId: 'INV-2024-0001',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未送付',
        additionalNotes: '顧客確認待ち'
      },
      reportingRepresentativeId: 'REP-001',
      responseDecision: {
        actionType: 'reissue' as const,
        actionDescription: '請求書を再発行し、顧客に直接送付',
        responseDeadline: new Date('2024-12-25T17:00:00Z'),
        respondingUserId: 'USR-ACC-001',
        respondingUserName: '経理太郎',
        respondingUserRole: '会計担当者'
      },
      currentDateTime: new Date('2024-12-20T10:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    const result = await notifyIssueResponse(input);

    expect(result).toBeDefined();
    expect(result.sentChannels).toEqual(['email', 'in_app']);
    expect(result.failedChannels).toEqual(['sms']);
    expect(result.sentRecipients).toHaveLength(2);
    expect(result.sentRecipients[0]).toMatchObject({
      userId: 'REP-001',
      userName: '営業花子',
      role: 'sales_representative',
      channel: 'email',
      sentAt: expect.any(Date)
    });
    expect(result.sentRecipients[1]).toMatchObject({
      userId: 'REP-001',
      userName: '営業花子',
      channel: 'in_app'
    });
    expect(result.failedRecipients).toHaveLength(1);
    expect(result.failedRecipients?.[0]).toMatchObject({
      userId: 'REP-001',
      userName: '営業花子',
      reason: 'SMSサービス利用不可'
    });
    expect(result.responseNotificationId).toBeTruthy();
  });
});
