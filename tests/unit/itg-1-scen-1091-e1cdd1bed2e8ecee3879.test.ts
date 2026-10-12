import { escalateResponseSLAExceeded, SupervisorContactInformationMissing } from '../../src/logic/notification-service';
import { fetchAllSalesRepresentatives } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1091: 上司の連絡先情報（メールアドレス・電話番号）が登録されていない場合、SupervisorContactInformationMissingエラーで処理を中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('上司の連絡先情報が登録されていない場合、SupervisorContactInformationMissingエラーを発生させる', async () => {
    const input = {
      inquiryId: 'INQ-20250107-001',
      inquiryContent: '新規取引先の与信審査状況を確認したいが、現在申請中で進捗が見えない',
      salesRepresentativeId: 'SR-12345',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2025-01-07T09:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-07T13:00:00Z'),
      currentDateTime: new Date('2025-01-07T14:30:00Z'),
      notificationChannels: ['email', 'sms'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'immediate' as const,
    };

    (fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        supervisorId: 'SUP-67890',
        supervisorName: '佐藤花子',
        salesRepresentativeId: 'SR-12345',
        role: '営業部長',
        isActive: true,
      },
    ]);

    const error = await escalateResponseSLAExceeded(input).catch(e => e);
    expect(error).toBeInstanceOf(SupervisorContactInformationMissing);
    expect(error.message).toBe('上司の連絡先が登録されていません。システム管理者に連絡してください。');
  });
});
