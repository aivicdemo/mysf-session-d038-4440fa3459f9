import { notifyIssueResponse, NotifyIssueResponseOutput, NotifyIssueResponseInput } from '../../src/logic/notification-service';
import * as datapersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1071: notifyIssueResponse - Edge case when response deadline equals current datetime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification successfully when responseDeadline equals currentDateTime', async () => {
    const input: NotifyIssueResponseInput = {
      issueContext: {
        dealId: 'DEAL-20240115-001',
        invoiceId: 'INV-2024-00501',
        amount: 250000,
        delayDays: 5,
        reason: '請求書未発行',
        additionalNotes: 'システム障害により自動生成失敗',
      },
      reportingRepresentativeId: 'REP-00123',
      responseDecision: {
        actionType: 'reissue',
        actionDescription: '請求書を再発行し、営業担当者を通じて顧客に送付する',
        responseDeadline: new Date('2024-01-16T14:30:00Z'),
        respondingUserId: 'ACC-00456',
        respondingUserName: '田中花子',
        respondingUserRole: '経理部長',
      },
      currentDateTime: new Date('2024-01-16T14:30:00Z'),
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
    };

    (datapersistence.fetchAllUsers as jest.Mock).mockResolvedValue([
      {
        userId: 'REP-00123',
        userName: '佐藤太郎',
        role: '営業担当者',
        email: 'satou.tarou@company.com',
        phone: '+81-90-1111-1111',
      },
    ]);

    const result = await notifyIssueResponse(input);

    expect(result).toBeDefined();
    expect(result.notificationId).not.toBe('');
    expect(result.notificationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.recipientCount).toBe(1);
    expect(result.sentChannels).toEqual(['email', 'in_app']);

    expect(result.sentRecipients).toHaveLength(2);
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'REP-00123',
        userName: '佐藤太郎',
        role: '営業担当者',
        channel: 'email',
        sentAt: new Date('2024-01-16T14:30:15Z'),
      })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        userId: 'REP-00123',
        userName: '佐藤太郎',
        role: '営業担当者',
        channel: 'in_app',
        sentAt: new Date('2024-01-16T14:30:16Z'),
      })
    );

    expect(result.failedRecipients).toBeUndefined();
    expect(result.failedChannels).toBeUndefined();
    expect(result.responseNotificationId).not.toBe('');
    expect(result.responseNotificationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
