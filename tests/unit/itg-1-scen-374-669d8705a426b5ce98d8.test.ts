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

describe('SCEN-374: 判定された複雑度レベルが定義済みの値（低・中・高）に該当しない場合、InvalidComplexityLevelError 例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('複雑度レベルが定義済みの値に該当しない場合、InvalidComplexityLevelError が発生する', async () => {
    const input = {
      inquiryId: 'INQ-2024-001',
      salesRepresentativeId: 'SR-001',
      inquiryContent: '複数商品の請求が混在している可能性があります',
      evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
    };

    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toThrow(InvalidComplexityLevelError);
    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toMatchObject({
      message: '問い合わせ複雑度の判定に失敗しました。',
    });

    // 出力は生成されない
    // エスカレーション通知が送信されない
    expect(notificationService.escalateResponseSLAExceeded).not.toHaveBeenCalled();
  });
});
