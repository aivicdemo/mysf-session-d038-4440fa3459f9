import { notifyIssueResponse } from '../../src/logic/notification-service';
import type { NotifyIssueResponseInput } from '../../src/logic/notification-service';

describe('SCEN-1073: notifyIssueResponse - 複数チャネル全て成功時の sentChannels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通知チャネルが複数種類指定され全て成功した場合、全チャネルで通知を送信し sentChannels に全て含める', async () => {
    const input: NotifyIssueResponseInput = {
      issueContext: {
        dealId: 'DEAL-001',
        invoiceId: 'INV-2024-001',
        amount: 500000,
        delayDays: 5,
        reason: '請求書未送付',
        additionalNotes: '営業担当者から報告あり',
      },
      reportingRepresentativeId: 'REP-001',
      responseDecision: {
        actionType: 'reissue',
        actionDescription: '請求書を再発行し、翌営業日までに送付する',
        responseDeadline: new Date('2024-12-25T17:00:00Z'),
        respondingUserId: 'BILLING-USER-001',
        respondingUserName: '田中太郎',
        respondingUserRole: '経理部長',
      },
      currentDateTime: new Date('2024-12-24T09:00:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'high',
    };

    const result = await notifyIssueResponse(input);

    // sentChannels が3つ全て含まれていること
    expect(result.sentChannels).toHaveLength(3);
    expect(result.sentChannels).toEqual(expect.arrayContaining(['email', 'sms', 'in_app']));

    // sentRecipients に3件のレコードが含まれること（チャネル別）
    expect(result.sentRecipients).toHaveLength(3);

    // 各チャネルが正しく represented されていること
    const channels = new Set(result.sentRecipients.map((r) => r.channel));
    expect(channels).toEqual(new Set(['email', 'sms', 'in_app']));

    // 各レコードが REP-001 を対象としていること
    result.sentRecipients.forEach((record) => {
      expect(record.userId).toBe('REP-001');
      expect(record.role).toBe('営業担当者');
    });

    // email チャネルのレコード
    const emailRecord = result.sentRecipients.find((r) => r.channel === 'email');
    expect(emailRecord).toBeDefined();
    expect(emailRecord!.sentAt).toBeTruthy();

    // sms チャネルのレコード
    const smsRecord = result.sentRecipients.find((r) => r.channel === 'sms');
    expect(smsRecord).toBeDefined();
    expect(smsRecord!.sentAt).toBeTruthy();

    // in_app チャネルのレコード
    const inAppRecord = result.sentRecipients.find((r) => r.channel === 'in_app');
    expect(inAppRecord).toBeDefined();
    expect(inAppRecord!.sentAt).toBeTruthy();

    // failedRecipients と failedChannels が undefined であること
    expect(result.failedRecipients).toBeUndefined();
    expect(result.failedChannels).toBeUndefined();

    // recipientCount = 1
    expect(result.recipientCount).toBe(1);

    // notificationId と responseNotificationId が一意の文字列であること
    expect(result.notificationId).toBeTruthy();
    expect(typeof result.notificationId).toBe('string');
    expect(result.responseNotificationId).toBeTruthy();
    expect(typeof result.responseNotificationId).toBe('string');
  });
});
