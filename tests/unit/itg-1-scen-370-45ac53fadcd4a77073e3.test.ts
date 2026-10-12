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

describe('SCEN-370: 複雑な問い合わせでSLA期限を超過している場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複雑度「高」、SLA超過判定、上司へのエスカレーション必要、通知送信されると判定される', async () => {
    const inquiryId = 'INQ-20250107-001';
    const salesRepresentativeId = 'SREP-12345';
    const inquiryContent =
      '既存の3つの商談における請求金額の計算ロジックに矛盾があり、請求明細の生成タイミングと商談ステージの進行が非同期で発生している問題。複数の取引先責任者が関わっており、過去6ヶ月分の商談・請求履歴の総合的な調査が必要。';
    const evaluationDateTime = new Date('2025-01-07T15:30:00Z');

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        salesRepresentativeId: 'SREP-12345',
        name: '田中太郎',
        supervisorId: 'SUP-99999',
        status: 'active',
      },
    ]);

    (notificationService.escalateResponseSLAExceeded as jest.Mock).mockResolvedValue({
      notificationId: 'NOTIF-20250107-ESC-001',
      sent: true,
      supervisorId: 'SUP-99999',
      escalatedAt: '2025-01-07T16:45:00Z',
    });

    const result = await evaluateAndEscalateInquiryResponseSLA({
      inquiryId,
      salesRepresentativeId,
      inquiryContent,
      evaluationDateTime,
    });

    expect(result.inquiryId).toBe('INQ-20250107-001');
    expect(result.complexityLevel).toBe('高');
    expect(result.slaDeadlineDateTime).toEqual(new Date('2025-01-07T16:30:00Z'));
    expect(result.isEscalationRequired).toBe(true);
    expect(result.escalationTargetSupervisorId).toBe('SUP-99999');
    expect(result.escalationNotificationSent).toBe(true);

    expect(notificationService.escalateResponseSLAExceeded as jest.Mock).toHaveBeenCalled();
  });
});
