import { notifyIssueResponse } from '../../src/logic/notification-service';
import type { NotifyIssueResponseInput } from '../../src/logic/notification-service';

describe('SCEN-1064: notifyIssueResponse - 通知送信成功時の通知結果', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告営業担当者が特定でき、対応方法が妥当で、対応期限が現在より後で、通知チャネルが正常で、全チャネルへの通知送信に成功した場合、通知IDと受信者情報を含む通知結果を返す', async () => {
    const input: NotifyIssueResponseInput = {
      issueContext: {
        dealId: 'DEAL-20250107-001',
        invoiceId: 'INV-2025-00456',
        amount: 1500000,
        delayDays: 5,
        reason: '請求書が誤ったメールアドレスに送付された',
        additionalNotes: '取引先側で受け取り確認済み',
      },
      reportingRepresentativeId: 'USER-SALES-0847',
      responseDecision: {
        actionType: 'reissue',
        actionDescription: '正しい請求先メールアドレスへ請求書を再発行し、取引先に確認連絡を実施',
        responseDeadline: new Date('2025-01-09T17:00:00Z'),
        respondingUserId: 'USER-BILLING-0312',
        respondingUserName: '鈴木太郎',
        respondingUserRole: '請求管理担当',
      },
      currentDateTime: new Date('2025-01-07T09:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    const result = await notifyIssueResponse(input);

    // 通知IDが生成されていること
    expect(result.notificationId).toBeTruthy();
    expect(typeof result.notificationId).toBe('string');

    // 受信者情報が正しく設定されていること
    expect(result.recipientCount).toBe(1);
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);

    // sentRecipients に3件のレコードが含まれること（チャネル別に1件ずつ）
    expect(result.sentRecipients).toHaveLength(3);

    // sentRecipients の各レコードが正しい構造を持つこと
    const emailRecord = result.sentRecipients.find((r) => r.channel === 'email');
    const smsRecord = result.sentRecipients.find((r) => r.channel === 'sms');
    const inAppRecord = result.sentRecipients.find((r) => r.channel === 'in_app');

    expect(emailRecord).toBeDefined();
    expect(emailRecord!.userId).toBe('USER-SALES-0847');
    expect(emailRecord!.role).toBe('sales_representative');
    expect(emailRecord!.sentAt).toBeTruthy();

    expect(smsRecord).toBeDefined();
    expect(smsRecord!.userId).toBe('USER-SALES-0847');
    expect(smsRecord!.channel).toBe('sms');

    expect(inAppRecord).toBeDefined();
    expect(inAppRecord!.userId).toBe('USER-SALES-0847');
    expect(inAppRecord!.channel).toBe('in_app');

    // 失敗した受信者・チャネルが undefined であること
    expect(result.failedRecipients).toBeUndefined();
    expect(result.failedChannels).toBeUndefined();

    // responseNotificationId が生成されていること
    expect(result.responseNotificationId).toBeTruthy();
    expect(typeof result.responseNotificationId).toBe('string');
  });
});
