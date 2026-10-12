import { notifyIssueResponse, InvalidNotificationChannels } from '../../src/logic/notification-service';

describe('SCEN-1068: notifyIssueResponse - invalid notification channels', () => {
  it('should throw InvalidNotificationChannels when notificationChannels is empty array', async () => {
    const input = {
      issueContext: {
        dealId: 'DEAL-2024-001',
        invoiceId: 'INV-2024-0001',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未送付',
        additionalNotes: '顧客から問い合わせあり'
      },
      reportingRepresentativeId: 'REP-001',
      responseDecision: {
        actionType: 'reissue' as const,
        actionDescription: '請求書を再発行し、顧客に直接送付する',
        responseDeadline: new Date('2025-01-20T17:00:00Z'),
        respondingUserId: 'ACC-001',
        respondingUserName: '田中経理',
        respondingUserRole: '経理担当'
      },
      currentDateTime: new Date('2025-01-15T09:00:00Z'),
      notificationChannels: [],
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueResponse(input)).rejects.toThrow(InvalidNotificationChannels);
    await expect(notifyIssueResponse(input)).rejects.toThrow('通知チャネルが指定されていないか不正です。メール・SMS・アプリ内通知から選択してください。');
  });
});
