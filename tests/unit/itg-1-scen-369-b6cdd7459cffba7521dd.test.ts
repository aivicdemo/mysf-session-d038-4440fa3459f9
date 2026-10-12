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

describe('SCEN-369: 中程度の複雑な問い合わせでSLA期限を超過している場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複雑度「中」、SLA超過判定、上司へのエスカレーション必要、通知送信されると判定される', async () => {
    const inquiryId = 'INQ-20250107-001';
    const salesRepresentativeId = 'SR-0001';
    const inquiryContent =
      '既存契約の修正条項について複数箇所の見直しが必要で、法務確認と価格再計算が発生する。前回の請求額との整合性も確認してほしい。';
    const evaluationDateTime = new Date('2025-01-07T15:30:00Z');

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        id: 'SR-0001',
        name: '営業太郎',
        status: 'active',
        supervisorId: 'SUP-0001',
      },
      {
        id: 'SUP-0001',
        name: '営業部長花子',
        status: 'active',
        supervisorId: null,
      },
    ]);

    (notificationService.escalateResponseSLAExceeded as jest.Mock).mockResolvedValue({
      sent: true,
      escalationTargetSupervisorId: 'SUP-0001',
      timestamp: '2025-01-07T16:05:00Z',
    });

    const result = await evaluateAndEscalateInquiryResponseSLA({
      inquiryId,
      salesRepresentativeId,
      inquiryContent,
      evaluationDateTime,
    });

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.complexityLevel).toBe('中');
    expect(result.slaDeadlineDateTime).toEqual(new Date('2025-01-07T16:00:00Z'));
    expect(result.isEscalationRequired).toBe(true);
    expect(result.escalationTargetSupervisorId).toBe('SUP-0001');
    expect(result.escalationNotificationSent).toBe(true);

    expect(notificationService.escalateResponseSLAExceeded as jest.Mock).toHaveBeenCalled();
  });
});
