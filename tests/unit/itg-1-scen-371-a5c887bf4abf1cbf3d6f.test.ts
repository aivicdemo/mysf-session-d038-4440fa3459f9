import { evaluateAndEscalateInquiryResponseSLA, InvalidInquiryContentError } from '../../src/logic/response-time-sla-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchAllSalesRepresentatives: jest.fn(),
}));

jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  escalateResponseSLAExceeded: jest.fn(),
}));

describe('SCEN-371: 問い合わせ内容が空文字列または null の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvalidInquiryContentError 例外が発生する', async () => {
    const inquiryId = 'INQ-20250107-001';
    const salesRepresentativeId = 'SR-12345';
    const inquiryContent = null as any;
    const evaluationDateTime = new Date('2025-01-07T10:00:00Z');

    await expect(
      evaluateAndEscalateInquiryResponseSLA({
        inquiryId,
        salesRepresentativeId,
        inquiryContent,
        evaluationDateTime,
      }),
    ).rejects.toThrow(InvalidInquiryContentError);

    await expect(
      evaluateAndEscalateInquiryResponseSLA({
        inquiryId,
        salesRepresentativeId,
        inquiryContent,
        evaluationDateTime,
      }),
    ).rejects.toThrow('問い合わせ内容が入力されていません。');
  });
});
