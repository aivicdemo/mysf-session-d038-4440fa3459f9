import { renderCorrectionTrackingHistory, CorrectionTrackingRetrievalFailed } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
}));

describe('SCEN-304: renderCorrectionTrackingHistory - 是正追跡管理テーブル取得失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正追跡管理テーブルからのレコード取得がシステム障害により失敗した場合、CorrectionTrackingRetrievalFailedエラーを発生させる', async () => {
    const discrepancyId = 'diff-12345';

    const discrepancyDetail = {
      discrepancyId: 'diff-12345',
      discrepancyDetection: {
        discrepancyId: 'diff-12345',
        legacySystemInvoiceId: 'SF-INV-001',
        newSystemInvoiceId: 'NEW-INV-001',
        discrepancyType: '金額差異',
        discrepancyContent: 'Amount mismatch',
        amountDifference: 1000,
        countDifference: null,
        statusDifference: null,
        severity: 'warning',
        detectionDateTime: '2025-01-15T10:30:00Z',
        causeClassification: null,
        toleranceJudgment: null,
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
      },
      legacySystemInvoice: null,
      newSystemInvoice: null,
      correctionTrackingHistory: [],
      confirmationHistory: [],
    };

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(discrepancyDetail);
    (discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(renderCorrectionTrackingHistory({
      discrepancyId,
    })).rejects.toThrow(CorrectionTrackingRetrievalFailed);
  });
});
