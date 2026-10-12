import { evaluateAndEscalateInquiryResponseSLA, SalesRepresentativeNotFoundError } from '../../src/logic/response-time-sla-management';
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

describe('SCEN-372: 指定された営業担当者IDが存在しないまたはステータスが無効である場合、SalesRepresentativeNotFoundError 例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('営業担当者IDが存在しない場合、SalesRepresentativeNotFoundError が発生する', async () => {
    const mockFetchAllSalesRepresentatives = dataPersistence.fetchAllSalesRepresentatives as jest.Mock;
    mockFetchAllSalesRepresentatives.mockResolvedValue([]);

    const input = {
      inquiryId: 'INQ-20250107-001',
      salesRepresentativeId: 'SR-99999',
      inquiryContent: '複雑な請求内容の照会です',
      evaluationDateTime: new Date('2025-01-07T10:00:00Z'),
    };

    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toThrow(SalesRepresentativeNotFoundError);
    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toMatchObject({
      message: '営業担当者が見つかりません。',
    });

    // エスカレーション通知が呼ばれないことを確認
    expect(notificationService.escalateResponseSLAExceeded).not.toHaveBeenCalled();
  });
});
