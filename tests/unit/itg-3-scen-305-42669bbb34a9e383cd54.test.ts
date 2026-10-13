import { renderCorrectionTrackingHistory, UserInformationRetrievalFailed } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
}));

describe('SCEN-305: renderCorrectionTrackingHistory - ユーザー情報取得失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正実行者のユーザー情報取得がシステム障害により失敗した場合、UserInformationRetrievalFailedエラーを発生させる', async () => {
    const discrepancyId = 'diff-12345';

    const correctionTrackingRecords = [
      {
        correctionId: 'corr-001',
        differenceId: 'diff-12345',
        correctionMethod: '手動修正',
        correctionStatus: '完了',
        correctionExecutorUserId: 'user-uuid-001',
        correctionExecutionDateTime: '2026-01-15T09:30:00Z',
        dataBeforeCorrection: 'old-data',
        dataAfterCorrection: 'new-data',
        verificationResult: '承認',
      },
      {
        correctionId: 'corr-002',
        differenceId: 'diff-12345',
        correctionMethod: 'システム同期',
        correctionStatus: '実行中',
        correctionExecutorUserId: 'user-uuid-002',
        correctionExecutionDateTime: '2026-01-16T14:15:00Z',
        dataBeforeCorrection: 'old-data-2',
        dataAfterCorrection: null,
        verificationResult: '検証待ち',
      },
    ];

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue({
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
      correctionTrackingHistory: correctionTrackingRecords,
      confirmationHistory: [],
    });

    (discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId as jest.Mock).mockResolvedValue(correctionTrackingRecords);

    // ユーザー情報取得時に、別の呼び出しで失敗するシナリオ
    // 実装がユーザー名を取得するために他の処理を呼ぶ場合、そこで失敗させる
    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock)
      .mockResolvedValueOnce({
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
        correctionTrackingHistory: correctionTrackingRecords,
        confirmationHistory: [],
      })
      .mockRejectedValueOnce(new Error('User information service unavailable'));

    await expect(renderCorrectionTrackingHistory({
      discrepancyId,
    })).rejects.toThrow(UserInformationRetrievalFailed);
  });
});
