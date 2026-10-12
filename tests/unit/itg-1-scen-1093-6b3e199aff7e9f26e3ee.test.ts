import { escalateResponseSLAExceeded, EscalateResponseSLAExceededInput } from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1093: 複数の上司が存在する場合、全員に通知を送信し、sentRecipientsに全員の詳細情報を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数の上司への通知が成功し、全員の詳細情報が sentRecipients に含まれる', async () => {
    // Mock fetchAllSalesRepresentatives to return two supervisors
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        salesRepresentativeId: 'SR-0042',
        supervisorId: 'SUP-0015',
        supervisorName: '佐藤次郎',
        role: '営業部長',
        email: 'satou.jiro@company.com',
        phone: '090-1234-5678',
        status: 'active',
      },
      {
        salesRepresentativeId: 'SR-0042',
        supervisorId: 'SUP-0016',
        supervisorName: '鈴木花子',
        role: '営業課長',
        email: 'suzuki.hanako@company.com',
        phone: '090-8765-4321',
        status: 'active',
      },
    ]);

    const input: EscalateResponseSLAExceededInput = {
      inquiryId: 'INQ-20250107-001',
      inquiryContent: '高額商品の納期確認と支払い条件についての問い合わせ',
      salesRepresentativeId: 'SR-0042',
      salesRepresentativeName: '田中太郎',
      inquiryReceivedDateTime: new Date('2025-01-07T09:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-07T17:00:00Z'),
      currentDateTime: new Date('2025-01-08T10:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'immediate',
    };

    const result = await escalateResponseSLAExceeded(input);

    // Verify the output contains correct escalation details
    expect(result.escalationNotificationId).toBeDefined();
    expect(result.supervisorId).toBe('SUP-0015');
    expect(result.supervisorName).toBe('佐藤次郎');
    expect(result.recipientCount).toBe(2);
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.escalationTimestamp).toEqual(new Date('2025-01-08T10:30:00Z'));

    // Verify SLA exceeded duration: 2025-01-08T10:30:00Z - 2025-01-07T17:00:00Z = 17.5 hours = 1050 minutes
    expect(result.slaExceededDurationMinutes).toBe(1050);

    // Verify sent recipients contains all supervisors with all channels
    expect(result.sentRecipients).toHaveLength(6);
    expect(result.sentRecipients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          supervisorId: 'SUP-0015',
          supervisorName: '佐藤次郎',
          role: '営業部長',
          channel: 'email',
          sentAt: new Date('2025-01-08T10:30:00Z'),
        }),
        expect.objectContaining({
          supervisorId: 'SUP-0015',
          supervisorName: '佐藤次郎',
          role: '営業部長',
          channel: 'sms',
          sentAt: new Date('2025-01-08T10:30:00Z'),
        }),
        expect.objectContaining({
          supervisorId: 'SUP-0015',
          supervisorName: '佐藤次郎',
          role: '営業部長',
          channel: 'in_app',
          sentAt: new Date('2025-01-08T10:30:00Z'),
        }),
        expect.objectContaining({
          supervisorId: 'SUP-0016',
          supervisorName: '鈴木花子',
          role: '営業課長',
          channel: 'email',
          sentAt: new Date('2025-01-08T10:30:00Z'),
        }),
        expect.objectContaining({
          supervisorId: 'SUP-0016',
          supervisorName: '鈴木花子',
          role: '営業課長',
          channel: 'sms',
          sentAt: new Date('2025-01-08T10:30:00Z'),
        }),
        expect.objectContaining({
          supervisorId: 'SUP-0016',
          supervisorName: '鈴木花子',
          role: '営業課長',
          channel: 'in_app',
          sentAt: new Date('2025-01-08T10:30:00Z'),
        }),
      ])
    );

    // Verify no failed recipients
    expect(result.failedRecipients).toBeUndefined();
  });
});
