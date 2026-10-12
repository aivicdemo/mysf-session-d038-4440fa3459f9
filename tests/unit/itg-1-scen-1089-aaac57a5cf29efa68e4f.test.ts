import { escalateResponseSLAExceeded, NotificationChannelUnavailable } from '../../src/logic/notification-service';
import { fetchAllSalesRepresentatives } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1089: 指定された通知チャネルが利用不可である場合、NotificationChannelUnavailableエラーで処理を中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通知チャネルが利用不可の場合、NotificationChannelUnavailableエラーを発生させる', async () => {
    const input = {
      inquiryId: 'INQ-20250101-001',
      inquiryContent: '大量注文の納期確認',
      salesRepresentativeId: 'SR-2025-0042',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2025-01-10T09:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-10T14:00:00Z'),
      currentDateTime: new Date('2025-01-10T15:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'immediate' as const,
    };

    (fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        supervisorId: 'SUP-2025-0015',
        supervisorName: '佐藤花子',
        role: '営業部長',
        email: 'satoh.hanako@company.com',
        phone: '09012345678',
      },
    ]);

    const error = await escalateResponseSLAExceeded(input).catch(e => e);
    expect(error).toBeInstanceOf(NotificationChannelUnavailable);
    expect(error.message).toBe('通知チャネルが利用できません。別の方法で上司に連絡してください。');
  });
});
