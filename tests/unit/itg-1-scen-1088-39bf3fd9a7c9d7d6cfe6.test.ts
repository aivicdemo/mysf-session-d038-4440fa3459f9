import { escalateResponseSLAExceeded, SupervisorNotFound } from '../../src/logic/notification-service';
import { fetchAllSalesRepresentatives } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1088: 営業担当者の上司が存在しないか無効な状態の場合、SupervisorNotFoundエラーで処理を中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者の上司IDが null の場合、SupervisorNotFoundエラーを発生させる', async () => {
    const input = {
      inquiryId: 'INQ-20250107-001',
      inquiryContent: '高度なカスタマイズが必要な請求書フォーマットについての問い合わせ',
      salesRepresentativeId: 'SR-12345',
      salesRepresentativeName: '田中太郎',
      inquiryReceivedDateTime: new Date('2025-01-07T09:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-07T12:00:00Z'),
      currentDateTime: new Date('2025-01-07T13:30:00Z'),
      notificationChannels: ['email', 'sms'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'immediate' as const,
    };

    (fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        salesRepresentativeId: 'SR-12345',
        salesRepresentativeName: '田中太郎',
        supervisorId: null,
        supervisorName: null,
        supervisorEmail: null,
        supervisorPhone: null,
      },
    ]);

    const error = await escalateResponseSLAExceeded(input).catch(e => e);
    expect(error).toBeInstanceOf(SupervisorNotFound);
    expect(error.message).toBe('上司情報が見つかりません。営業担当者の上司設定を確認してください。');
  });
});
