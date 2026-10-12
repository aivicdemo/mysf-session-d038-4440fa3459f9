import { evaluateAndEscalateInquiryResponseSLA } from '../../src/logic/response-time-sla-management';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
}));
jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  escalateResponseSLAExceeded: jest.fn(),
}));

describe('SCEN-378: 問い合わせ受付日時が現在より未来の場合、警告が出力されて処理が継続される', () => {
  it('未来日時の入力に対して警告ログが出力され、処理は継続して完了する', async () => {
    const evaluationDateTime = new Date('2025-01-07T12:00:00Z');

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: [
        {
          salesRepresentativeId: 'SR-12345',
          name: '営業太郎',
          emailAddress: 'taro@example.com',
          phoneNumber: null,
          department: 'Sales',
          jobTitle: 'Sales Rep',
          supervisorId: 'SV-001',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: null,
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-07T11:30:00Z',
    });

    (notificationService.escalateResponseSLAExceeded as jest.Mock).mockResolvedValue({
      escalationNotificationId: 'notif-001',
      supervisorId: 'SV-001',
      supervisorName: '管理者太郎',
      recipientCount: 1,
      sentChannels: ['email'],
      sentRecipients: [
        {
          supervisorId: 'SV-001',
          supervisorName: '管理者太郎',
          role: 'manager',
          channel: 'email',
          sentAt: new Date('2025-01-07T11:30:00Z'),
        },
      ],
      escalationTimestamp: new Date('2025-01-07T11:30:00Z'),
      slaExceededDurationMinutes: 15,
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await evaluateAndEscalateInquiryResponseSLA({
      inquiryId: 'INQ-20250107-001',
      salesRepresentativeId: 'SR-12345',
      inquiryContent: '商品の仕様変更対応が可能かどうかについての複雑な問い合わせ',
      evaluationDateTime,
    });

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.complexityLevel).toBe('高');
    expect(result.slaDeadlineDateTime).toBeDefined();
    expect(result.isEscalationRequired).toBeDefined();
    expect(result.escalationTargetSupervisorId).toBe('SV-001');
    expect(result.escalationNotificationSent).toBeDefined();

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls.some(call =>
      typeof call[0] === 'string' && call[0].includes('問い合わせ受け取り時刻が現在時刻より後になっています')
    )).toBe(true);

    consoleSpy.mockRestore();
  });
});
