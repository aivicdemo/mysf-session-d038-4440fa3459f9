import { escalateResponseSLAExceeded, SalesRepresentativeNotFound } from '../../src/logic/notification-service';
import { fetchAllSalesRepresentatives } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1087: 営業担当者のレコードが存在しない場合、SalesRepresentativeNotFoundエラーで処理を中断', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者が見つからない場合、SalesRepresentativeNotFoundエラーを発生させる', async () => {
    const input = {
      inquiryId: 'INQ-2025-001',
      inquiryContent: '請求書の金額確認について',
      salesRepresentativeId: 'SR-99999',
      salesRepresentativeName: '山田太郎',
      inquiryReceivedDateTime: new Date('2025-01-15T10:00:00Z'),
      slaDeadlineDateTime: new Date('2025-01-15T14:00:00Z'),
      currentDateTime: new Date('2025-01-15T16:00:00Z'),
      notificationChannels: ['email', 'in_app'] as Array<'email' | 'sms' | 'in_app'>,
      urgencyLevel: 'high' as const,
    };

    (fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([]);

    const error = await escalateResponseSLAExceeded(input).catch(e => e);
    expect(error).toBeInstanceOf(SalesRepresentativeNotFound);
    expect(error.message).toBe('営業担当者情報が見つかりません。システム管理者に連絡してください。');
  });
});
