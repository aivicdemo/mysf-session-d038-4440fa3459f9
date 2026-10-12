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

describe('SCEN-379: SLA超過時にエスカレーション通知の送信に失敗した場合、エスカレーション通知送信フラグが false となる', () => {
  it('通知送信失敗時に escalationNotificationSent が false で返される', async () => {
    const evaluationDateTime = new Date('2025-01-07T10:00:00Z');

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue({
      salesRepresentatives: [
        {
          salesRepresentativeId: 'SR-12345',
          name: '田中太郎',
          emailAddress: 'tanaka@example.com',
          phoneNumber: null,
          department: 'Sales',
          jobTitle: 'Sales Rep',
          supervisorId: 'SUP-5001',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          updatedBy: null,
        },
      ],
      totalCount: 1,
      fetchedAt: '2025-01-07T11:15:00Z',
    });

    (notificationService.escalateResponseSLAExceeded as jest.Mock).mockRejectedValue(
      new Error('notification service unavailable')
    );

    const result = await evaluateAndEscalateInquiryResponseSLA({
      inquiryId: 'INQ-20250107-001',
      salesRepresentativeId: 'SR-12345',
      inquiryContent: '請求書の金額が前月と異なります。詳細な確認をお願いします。',
      evaluationDateTime,
    });

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.complexityLevel).toBe('高');
    expect(result.slaDeadlineDateTime).toEqual(new Date('2025-01-07T11:00:00Z'));
    expect(result.isEscalationRequired).toBe(true);
    expect(result.escalationTargetSupervisorId).toBe('SUP-5001');
    expect(result.escalationNotificationSent).toBe(false);
  });
});
