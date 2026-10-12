import { escalateResponseSLAExceeded, type EscalateResponseSLAExceededInput } from '../../src/logic/notification-service';
import * as dataStore from '../../src/platform/data-store';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
}));

describe('SCEN-1085: SLA超過した問い合わせについて、営業担当者の上司に複数チャネルで通知を送信し、送信結果の詳細を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should escalate SLA exceeded inquiry and send notifications via multiple channels', async () => {
    const mockInquiry = {
      id: 'INQ-20250107-001',
      content: '納品予定日の変更について急ぎで相談したい',
      salesRepresentativeId: 'SR-12345',
      receivedDateTime: new Date('2025-01-07T09:00:00Z'),
    };

    const mockSupervisors = [
      {
        supervisorId: 'SUP-001',
        supervisorName: '佐藤花子',
        role: '営業部長',
        email: 'satou.hanako@company.com',
        phone: '09012345678',
        status: 'active',
      },
      {
        supervisorId: 'SUP-002',
        supervisorName: '鈴木次郎',
        role: '営業課長',
        email: 'suzuki.jiro@company.com',
        phone: '09087654321',
        status: 'active',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockInquiry]);
    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(mockSupervisors);

    const input: EscalateResponseSLAExceededInput = {
      inquiryId: 'INQ-20250107-001',
      inquiryContent: '納品予定日の変更について急ぎで相談したい',
      salesRepresentativeId: 'SR-12345',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2025-01-07T09:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-07T12:00:00Z'),
      currentDateTime: new Date('2025-01-07T13:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'],
      urgencyLevel: 'immediate',
    };

    const result = await escalateResponseSLAExceeded(input);

    expect(result.slaExceededDurationMinutes).toBe(90);
    expect(result.recipientCount).toBe(2);
    expect(result.supervisorId).toBe('SUP-001');
    expect(result.supervisorName).toBe('佐藤花子');
    expect(result.sentChannels).toEqual(['email', 'sms', 'in_app']);
    expect(result.sentRecipients).toHaveLength(6);

    const sup001Emails = result.sentRecipients.filter(
      (r) => r.supervisorId === 'SUP-001' && r.channel === 'email'
    );
    expect(sup001Emails).toHaveLength(1);
    expect(sup001Emails[0].sentAt).toEqual(new Date('2025-01-07T13:30:05Z'));

    const sup001Sms = result.sentRecipients.filter(
      (r) => r.supervisorId === 'SUP-001' && r.channel === 'sms'
    );
    expect(sup001Sms).toHaveLength(1);
    expect(sup001Sms[0].sentAt).toEqual(new Date('2025-01-07T13:30:06Z'));

    const sup001InApp = result.sentRecipients.filter(
      (r) => r.supervisorId === 'SUP-001' && r.channel === 'in_app'
    );
    expect(sup001InApp).toHaveLength(1);
    expect(sup001InApp[0].sentAt).toEqual(new Date('2025-01-07T13:30:07Z'));

    const sup002Emails = result.sentRecipients.filter(
      (r) => r.supervisorId === 'SUP-002' && r.channel === 'email'
    );
    expect(sup002Emails).toHaveLength(1);
    expect(sup002Emails[0].sentAt).toEqual(new Date('2025-01-07T13:30:05Z'));

    expect(result.failedRecipients).toBeUndefined();
    expect(result.escalationTimestamp).toEqual(new Date('2025-01-07T13:30:07Z'));
    expect(result.escalationNotificationId).toBeTruthy();
  });
});
