import { escalateResponseSLAExceeded } from '../../src/logic/notification-service';
import type {
  EscalateResponseSLAExceededInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1094: escalateResponseSLAExceeded with partial channel failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return successful channels and successful recipients when some channels fail', async () => {
    const supervisorData = [
      {
        supervisorId: 'SUP-001',
        supervisorName: '佐藤次郎',
        role: '営業マネージャー',
        emailAddress: 'satou.jiro@company.com',
        phoneNumber: '09012345678',
      },
      {
        supervisorId: 'SUP-002',
        supervisorName: '鈴木花子',
        role: '営業部長',
        emailAddress: 'suzuki.hanako@company.com',
        phoneNumber: '09087654321',
      },
    ];

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(
      supervisorData
    );

    const input: EscalateResponseSLAExceededInput = {
      inquiryId: 'INQ-20250107-001',
      inquiryContent: '請求書の金額が異なっているのだが、確認してほしい',
      salesRepresentativeId: 'SR-12345',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2025-01-07T08:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-07T12:00:00Z'),
      currentDateTime: new Date('2025-01-07T14:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'immediate',
    };

    const result = await escalateResponseSLAExceeded(input);

    expect(result).toBeDefined();
    expect(result.escalationNotificationId).toBeDefined();
    expect(result.escalationNotificationId).toMatch(/^esc-notif-/);
    expect(result.supervisorId).toBe('SUP-001');
    expect(result.supervisorName).toBe('佐藤次郎');
    expect(result.recipientCount).toBe(2);

    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('in_app');
    expect(result.sentChannels).not.toContain('sms');

    expect(result.sentRecipients.length).toBe(2);
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        supervisorId: 'SUP-001',
        supervisorName: '佐藤次郎',
        role: '営業マネージャー',
        channel: 'email',
        sentAt: new Date('2025-01-07T14:30:00Z'),
      })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        supervisorId: 'SUP-002',
        supervisorName: '鈴木花子',
        role: '営業部長',
        channel: 'in_app',
        sentAt: new Date('2025-01-07T14:30:00Z'),
      })
    );

    expect(result.failedRecipients).toBeDefined();
    expect(result.failedRecipients?.length).toBe(1);
    expect(result.failedRecipients?.[0]).toEqual(
      expect.objectContaining({
        supervisorId: 'SUP-001',
        supervisorName: '佐藤次郎',
        reason: 'キャリア障害',
      })
    );

    expect(result.escalationTimestamp).toEqual(new Date('2025-01-07T14:30:00Z'));
    expect(result.slaExceededDurationMinutes).toBe(150);
  });
});
