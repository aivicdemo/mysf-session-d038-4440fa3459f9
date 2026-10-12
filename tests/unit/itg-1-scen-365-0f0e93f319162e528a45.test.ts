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

describe('SCEN-365: 単純な問い合わせで、SLA期限内に処理される場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複雑度「低」と応答期限を設定し、エスカレーション不要と判定される', async () => {
    const inquiryId = 'INQ-20250107-001';
    const salesRepresentativeId = 'SR-12345';
    const inquiryContent = '既存契約の請求金額確認についてお問い合わせです。';
    const evaluationDateTime = new Date('2025-01-07T10:00:00Z');

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      { id: 'SR-12345', name: '田中太郎', status: 'active' },
    ]);

    const result = await evaluateAndEscalateInquiryResponseSLA({
      inquiryId,
      salesRepresentativeId,
      inquiryContent,
      evaluationDateTime,
    });

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.complexityLevel).toBe('低');
    expect(result.slaDeadlineDateTime).toEqual(new Date('2025-01-07T10:15:00Z'));
    expect(result.isEscalationRequired).toBe(false);
    expect(result.escalationTargetSupervisorId).toBeNull();
    expect(result.escalationNotificationSent).toBe(false);

    expect(notificationService.escalateResponseSLAExceeded as jest.Mock).not.toHaveBeenCalled();
  });
});
