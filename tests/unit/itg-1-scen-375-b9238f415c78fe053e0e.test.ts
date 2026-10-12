import { evaluateAndEscalateInquiryResponseSLA, SLACalculationError } from '../../src/logic/response-time-sla-management';
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

describe('SCEN-375: 複雑度レベルに対応するSLA時間が定義されていない場合、SLACalculationError 例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('複雑度レベル「高」に対応するSLA時間が定義されていない場合、SLACalculationError が発生する', async () => {
    const mockFetchAllSalesRepresentatives = dataPersistence.fetchAllSalesRepresentatives as jest.Mock;
    mockFetchAllSalesRepresentatives.mockResolvedValue([
      {
        id: 'SR-12345',
        name: '営業担当者A',
        status: '有効',
        supervisorId: 'SUP-001',
      },
    ]);

    const input = {
      inquiryId: 'INQ-20250107-001',
      salesRepresentativeId: 'SR-12345',
      inquiryContent: '請求書に記載された金額が商談内容と異なります。詳細な確認をお願いします。',
      evaluationDateTime: new Date('2025-01-07T14:30:00Z'),
    };

    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toThrow(SLACalculationError);
    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toMatchObject({
      message: '応答時間SLAの計算に失敗しました。',
    });

    // 出力は返されない
    expect(notificationService.escalateResponseSLAExceeded).not.toHaveBeenCalled();
  });
});
