import { escalateResponseSLAExceeded, SLANotExceeded } from '../../src/logic/notification-service';
import { fetchAllSalesRepresentatives } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1090: 現在日時がSLA期限内でSLA超過していない場合、SLANotExceededエラーで処理を中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SLA期限を超過していない場合、SLANotExceededエラーを発生させる', async () => {
    const input = {
      inquiryId: 'INQ-20250107-001',
      inquiryContent: '請求書の金額についての問い合わせ',
      salesRepresentativeId: 'SR-0001',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2025-01-07T09:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-07T13:00:00Z'),
      currentDateTime: new Date('2025-01-07T12:30:00Z'),
      notificationChannels: ['email', 'sms', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    const error = await escalateResponseSLAExceeded(input).catch(e => e);
    expect(error).toBeInstanceOf(SLANotExceeded);
    expect(error.message).toBe('応答時間SLAはまだ超過していません。');
  });
});
