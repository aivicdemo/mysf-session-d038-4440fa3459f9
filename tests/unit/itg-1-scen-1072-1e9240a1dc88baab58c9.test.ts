import { notifyIssueResponse } from '../../src/logic/notification-service';
import type { NotifyIssueResponseInput } from '../../src/logic/notification-service';

describe('SCEN-1072: notifyIssueResponse - 単一チャネル指定時の送信', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通知チャネルが1種類だけ指定された場合、そのチャネルのみで通知を送信する', async () => {
    const input: NotifyIssueResponseInput = {
      issueContext: {
        dealId: 'DEAL-20250107-001',
        invoiceId: 'INV-2025-0042',
        amount: 250000,
        delayDays: 5,
        reason: '請求書の作成漏れ',
        additionalNotes: '営業担当者の確認漏れで発見遅延',
      },
      reportingRepresentativeId: 'USER-SALES-0087',
      responseDecision: {
        actionType: 'reissue',
        actionDescription: '請求書を再作成し、営業担当者経由で取引先に送付する',
        responseDeadline: new Date('2025-01-15T18:00:00Z'),
        respondingUserId: 'USER-ACCOUNTING-0034',
        respondingUserName: '佐藤太郎',
        respondingUserRole: '経理部長',
      },
      currentDateTime: new Date('2025-01-10T09:30:00Z'),
      notificationChannels: ['email'],
      urgencyLevel: 'high',
    };

    const result = await notifyIssueResponse(input);

    // sentChannels に email のみが含まれていること
    expect(result.sentChannels).toEqual(['email']);
    expect(result.sentChannels).toHaveLength(1);

    // sentRecipients に1件のレコードが含まれること（email チャネルのみ）
    expect(result.sentRecipients).toHaveLength(1);

    // email チャネルのレコードが正しい内容を持つこと
    const emailRecord = result.sentRecipients[0];
    expect(emailRecord.userId).toBe('USER-SALES-0087');
    expect(emailRecord.role).toBe('営業担当者');
    expect(emailRecord.channel).toBe('email');
    expect(emailRecord.sentAt).toBeTruthy();

    // notificationId が一意の文字列であること
    expect(result.notificationId).toBeTruthy();
    expect(typeof result.notificationId).toBe('string');

    // recipientCount = 1
    expect(result.recipientCount).toBe(1);

    // failedRecipients と failedChannels が undefined であること
    expect(result.failedRecipients).toBeUndefined();
    expect(result.failedChannels).toBeUndefined();

    // responseNotificationId が設定されていること
    expect(result.responseNotificationId).toBeTruthy();
    expect(typeof result.responseNotificationId).toBe('string');

    // SMS とアプリ内通知チャネルが使用されていないこと
    const smsRecord = result.sentRecipients.find((r) => r.channel === 'sms');
    const inAppRecord = result.sentRecipients.find((r) => r.channel === 'in_app');
    expect(smsRecord).toBeUndefined();
    expect(inAppRecord).toBeUndefined();
  });
});
