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

describe('SCEN-377: 営業担当者IDが空または無効な場合、設計済みエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('営業担当者IDが空文字列の場合、SalesRepresentativeNotFoundError が発生する', async () => {
    const mockFetchAllSalesRepresentatives = dataPersistence.fetchAllSalesRepresentatives as jest.Mock;
    mockFetchAllSalesRepresentatives.mockResolvedValue([]);

    const input = {
      inquiryId: 'INQ-20240115-001',
      salesRepresentativeId: '',
      inquiryContent: '請求書の金額が前月と異なります。確認をお願いします。',
      evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
    };

    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toThrow(SalesRepresentativeNotFoundError);
    await expect(evaluateAndEscalateInquiryResponseSLA(input)).rejects.toMatchObject({
      message: '営業担当者が見つかりません。',
    });
  });
});
