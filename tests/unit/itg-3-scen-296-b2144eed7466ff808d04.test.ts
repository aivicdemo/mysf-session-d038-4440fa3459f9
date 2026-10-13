import { renderDiscrepancyDetailPanel, UnauthorizedAccessError } from '../../src/logic/dashboard-presentation';
import * as persistenceModule from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-296: 操作ユーザーが差異詳細確認の権限を持たない場合、権限不足エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedAccessError when user lacks authorization for discrepancy detail confirmation', async () => {
    const mockRetrieve = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    const discrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'INV-2024-001',
      newSystemInvoiceId: 'INV-NEW-2024-001',
      discrepancyType: '金額差異',
      discrepancyContent: 'Amount mismatch',
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2024-01-15T10:30:00Z',
      severity: 'warning',
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };
    mockRetrieve.mockResolvedValue({
      discrepancyId: discrepancyDetail.discrepancyId,
      discrepancyDetection: discrepancyDetail,
      legacySystemInvoice: null,
      newSystemInvoice: null,
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    const input = {
      requestUserId: 'user-002',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(renderDiscrepancyDetailPanel(input)).rejects.toThrow(UnauthorizedAccessError);
  });

  it('should include error message "この操作を実行する権限がありません。"', async () => {
    const mockRetrieve = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    const discrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'INV-2024-001',
      newSystemInvoiceId: 'INV-NEW-2024-001',
      discrepancyType: '金額差異',
      discrepancyContent: 'Amount mismatch',
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2024-01-15T10:30:00Z',
      severity: 'warning',
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };
    mockRetrieve.mockResolvedValue({
      discrepancyId: discrepancyDetail.discrepancyId,
      discrepancyDetection: discrepancyDetail,
      legacySystemInvoice: null,
      newSystemInvoice: null,
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    const input = {
      requestUserId: 'user-002',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    try {
      await renderDiscrepancyDetailPanel(input);
      fail('Should have thrown UnauthorizedAccessError');
    } catch (error) {
      if (error instanceof UnauthorizedAccessError) {
        expect(error.message).toBe('この操作を実行する権限がありません。');
      } else {
        throw error;
      }
    }
  });
});
