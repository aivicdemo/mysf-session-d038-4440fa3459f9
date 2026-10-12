import { escalateResponseSLAExceeded } from '../../src/logic/notification-service';
import type {
  EscalateResponseSLAExceededInput,
} from '../../src/logic/notification-service';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1095: escalateResponseSLAExceeded SLA exceeded time calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate SLA exceeded duration in minutes correctly', async () => {
    const supervisorData = [
      {
        salesRepresentativeId: 'SR-0042',
        supervisorId: 'SUP-0015',
        supervisorName: '鈴木花子',
        supervisorEmail: 'suzuki.hanako@company.com',
        supervisorPhone: '090-1234-5678',
        role: '営業部長',
      },
    ];

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue(
      supervisorData
    );

    const input: EscalateResponseSLAExceededInput = {
      inquiryId: 'INQ-20250107-001',
      inquiryContent: '大口発注の見積もり依頼（納期短縮希望）',
      salesRepresentativeId: 'SR-0042',
      salesRepresentativeName: '田中太郎',
      inquiryReceivedDateTime: new Date('2025-01-07T09:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-07T12:00:00Z'),
      currentDateTime: new Date('2025-01-07T12:47:30Z'),
      notificationChannels: ['email', 'in_app'],
      urgencyLevel: 'high',
    };

    const result = await escalateResponseSLAExceeded(input);

    expect(result).toBeDefined();
    expect(result.escalationNotificationId).toMatch(/^esc-notif-/);
    expect(result.supervisorId).toBe('SUP-0015');
    expect(result.supervisorName).toBe('鈴木花子');
    expect(result.recipientCount).toBe(1);

    // Verify SLA exceeded duration is calculated correctly
    // 12:47:30 - 12:00:00 = 47 minutes 30 seconds => should be 47 minutes when converted to integer
    expect(result.slaExceededDurationMinutes).toBe(47);

    expect(result.sentChannels).toContain('email');
    expect(result.sentChannels).toContain('in_app');
    expect(result.sentChannels.length).toBe(2);

    expect(result.sentRecipients.length).toBe(2);
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        supervisorId: 'SUP-0015',
        supervisorName: '鈴木花子',
        role: '営業部長',
        channel: 'email',
      })
    );
    expect(result.sentRecipients).toContainEqual(
      expect.objectContaining({
        supervisorId: 'SUP-0015',
        supervisorName: '鈴木花子',
        role: '営業部長',
        channel: 'in_app',
      })
    );

    expect(result.escalationTimestamp).toEqual(new Date('2025-01-07T12:47:30Z'));
  });
});
