import { evaluateAndEscalateInquiryResponseSLA, InvalidComplexityLevelError } from '../../src/logic/response-time-sla-management';
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

describe('SCEN-376: 問い合わせ複雑度が定義済みの値に該当しない場合、設計済みエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('複雑度レベルが「不明」として決定される場合、InvalidComplexityLevelError が発生する', async () => {
    const mockFetchAllSalesRepresentatives = dataPersistence.fetchAllSalesRepresentatives as jest.Mock;
    mockFetchAllSalesRepresentatives.mockResolvedValue([
      {
        id: 'SR-12345',
        name: '田中太郎',
        supervisorId: 'SUP-001',
        status: 'active',
      },
    ]);

    const input = {
      inquiryId: 'INQ-20250107-001',
      salesRepresentativeId: 'SR-12345',
      inquiryContent: '請求書の金額が前月と異なる理由を教えてください。',
      evaluationDateTime: new Date('2025-01-07T14:30:00Z'),
    };

    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toThrow(InvalidComplexityLevelError);
    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toMatchObject({
      message: '問い合わせ複雑度の判定に失敗しました。',
    });

    // 出力型の値は返されず、エスカレーション処理は実行されない
    expect(notificationService.escalateResponseSLAExceeded).not.toHaveBeenCalled();
  });
});
