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

describe('SCEN-368: 単純な問い合わせでもSLA期限を超過している場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複雑度「低」、SLA超過判定、上司へのエスカレーション必要、通知送信されると判定される', async () => {
    const inquiryId = 'INQ-20250107-001';
    const salesRepresentativeId = 'SR-12345';
    const inquiryContent = '請求書の送付先住所を変更したい';
    const evaluationDateTime = new Date('2025-01-07T10:00:00Z');

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      { salesRepId: 'SR-12345', supervisorId: 'SUP-67890' },
    ]);

    (notificationService.escalateResponseSLAExceeded as jest.Mock).mockResolvedValue({});

    const result = await evaluateAndEscalateInquiryResponseSLA({
      inquiryId,
      salesRepresentativeId,
      inquiryContent,
      evaluationDateTime,
    });

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.complexityLevel).toBe('低');
    expect(result.slaDeadlineDateTime).toEqual(new Date('2025-01-07T10:15:00Z'));
    expect(result.isEscalationRequired).toBe(true);
    expect(result.escalationTargetSupervisorId).toBe('SUP-67890');
    expect(result.escalationNotificationSent).toBe(true);

    expect(notificationService.escalateResponseSLAExceeded as jest.Mock).toHaveBeenCalledWith({
      inquiryId: 'INQ-20250107-001',
      complexityLevel: '低',
      isEscalationRequired: true,
      escalationTargetSupervisorId: 'SUP-67890',
    });
  });
});
