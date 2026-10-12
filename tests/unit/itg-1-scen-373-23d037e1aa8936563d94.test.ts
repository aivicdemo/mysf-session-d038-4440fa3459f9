import { evaluateAndEscalateInquiryResponseSLA, SupervisorNotFoundError } from '../../src/logic/response-time-sla-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
}));

jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  escalateResponseSLAExceeded: jest.fn(),
}));

import * as notificationService from '../../src/logic/notification-service';

describe('SCEN-373: 営業担当者の上司が存在しないまたはステータスが無効である場合、SupervisorNotFoundError 例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('営業担当者の上司情報が null の場合、SupervisorNotFoundError が発生する', async () => {
    const mockFetchAllSalesRepresentatives = dataPersistence.fetchAllSalesRepresentatives as jest.Mock;
    mockFetchAllSalesRepresentatives.mockResolvedValue([
      {
        salesRepresentativeId: 'SR-12345',
        supervisorInformation: null,
      },
    ]);

    const input = {
      inquiryId: 'INQ-20250107-001',
      salesRepresentativeId: 'SR-12345',
      inquiryContent: '既存契約の解約手続きと違約金について複数質問があります。',
      evaluationDateTime: new Date('2025-01-07T14:30:00Z'),
    };

    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toThrow(SupervisorNotFoundError);
    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toMatchObject({
      message: '上司が見つかりません。エスカレーション対象を特定できません。',
    });

    // エスカレーション通知が呼ばれないことを確認
    expect(notificationService.escalateResponseSLAExceeded).not.toHaveBeenCalled();
  });
});
