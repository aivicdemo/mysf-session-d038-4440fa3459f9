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

describe('SCEN-367: 複雑な問い合わせで、SLA期限内に処理される場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複雑度「高」と応答期限を設定し、エスカレーション不要と判定される', async () => {
    const inquiryId = 'INQ-20240115-001';
    const salesRepresentativeId = 'SR-12345';
    const inquiryContent =
      '既存の商談に関連する複数の請求書の金額差分について、過去6ヶ月の取引履歴と照合しながら確認が必要。また関連する複数案件の請求ステータス統合確認も併せて必要';
    const evaluationDateTime = new Date('2024-01-15T10:00:00Z');

    (dataPersistence.fetchAllSalesRepresentatives as jest.Mock).mockResolvedValue([
      {
        salesRepresentativeId: 'SR-12345',
        escalationTargetSupervisorId: 'SUP-67890',
        supervisorName: '営業部長 田中太郎',
        supervisorStatus: '有効',
      },
    ]);

    const result = await evaluateAndEscalateInquiryResponseSLA({
      inquiryId,
      salesRepresentativeId,
      inquiryContent,
      evaluationDateTime,
    });

    expect(result.complexityLevel).toBe('高');
    expect(result.slaDeadlineDateTime).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(result.isEscalationRequired).toBe(false);
    expect(result.escalationTargetSupervisorId).toBeNull();
    expect(result.escalationNotificationSent).toBe(false);

    expect(notificationService.escalateResponseSLAExceeded as jest.Mock).not.toHaveBeenCalled();
  });
});
