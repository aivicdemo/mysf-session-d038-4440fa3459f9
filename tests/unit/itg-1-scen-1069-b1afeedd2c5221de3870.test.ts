import { notifyIssueResponse, NotificationSendFailure, NotifyIssueResponseInput } from '../../src/logic/notification-service';

describe('SCEN-1069: 外部通知サービスへの接続失敗またはサービス利用不可により全チャネルの送信に失敗した場合、NotificationSendFailure エラーを返す', () => {
  it('全チャネル送信失敗時に NotificationSendFailure を throw', async () => {
    const input: NotifyIssueResponseInput = {
      issueContext: {
        dealId: 'DEAL-20250101-001',
        invoiceId: 'INV-20250101-001',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未送付',
        additionalNotes: '顧客から確認なし'
      },
      reportingRepresentativeId: 'REP-00001',
      responseDecision: {
        actionType: 'reissue' as const,
        actionDescription: '請求書を再発行し、顧客に直接送付する',
        responseDeadline: new Date('2025-01-15T17:00:00Z'),
        respondingUserId: 'ACC-00001',
        respondingUserName: '田中太郎',
        respondingUserRole: '経理部長'
      },
      currentDateTime: new Date('2025-01-08T09:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const
    };

    await expect(notifyIssueResponse(input)).rejects.toThrow(NotificationSendFailure);
    await expect(notifyIssueResponse(input)).rejects.toThrow('通知の送信に失敗しました。ネットワーク接続と通知サービスの状態を確認してください。');
  });
});
