import { renderDiscrepancyDetailPanel, ToleranceCriteriaNotFoundError } from '../../src/logic/dashboard-presentation';
import * as persistenceModule from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-297: 差異種類に対応する許容基準がマスタに登録されていない場合、ToleranceCriteriaNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ToleranceCriteriaNotFoundError when tolerance criteria is null', async () => {
    const mockRetrieveDis = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    const mockRetrieveCor = persistenceModule.retrieveCorrectionTrackingByDifferenceId as jest.Mock;
    const mockRetrieveTol = persistenceModule.retrieveToleranceCriteriaByType as jest.Mock;

    const discrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'SF-INV-202501-001',
      newSystemInvoiceId: 'NEW-INV-202501-001',
      discrepancyType: '金額差異',
      discrepancyContent: 'Amount difference',
      amountDifference: 15000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:30:00Z',
      severity: 'critical',
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    mockRetrieveDis.mockResolvedValue({
      discrepancyId: discrepancyDetail.discrepancyId,
      discrepancyDetection: discrepancyDetail,
      legacySystemInvoice: null,
      newSystemInvoice: null,
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    mockRetrieveCor.mockResolvedValue([]);
    mockRetrieveTol.mockResolvedValue(null);

    const input = {
      requestUserId: 'user-12345',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(renderDiscrepancyDetailPanel(input)).rejects.toThrow(ToleranceCriteriaNotFoundError);
  });

  it('should include error message "差異種類の許容基準が設定されていません。" in thrown error', async () => {
    const mockRetrieveDis = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    const mockRetrieveCor = persistenceModule.retrieveCorrectionTrackingByDifferenceId as jest.Mock;
    const mockRetrieveTol = persistenceModule.retrieveToleranceCriteriaByType as jest.Mock;

    const discrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'SF-INV-202501-001',
      newSystemInvoiceId: 'NEW-INV-202501-001',
      discrepancyType: '金額差異',
      discrepancyContent: 'Amount difference',
      amountDifference: 15000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:30:00Z',
      severity: 'critical',
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    mockRetrieveDis.mockResolvedValue({
      discrepancyId: discrepancyDetail.discrepancyId,
      discrepancyDetection: discrepancyDetail,
      legacySystemInvoice: null,
      newSystemInvoice: null,
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    mockRetrieveCor.mockResolvedValue([]);
    mockRetrieveTol.mockResolvedValue(null);

    const input = {
      requestUserId: 'user-12345',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    try {
      await renderDiscrepancyDetailPanel(input);
      fail('Should have thrown ToleranceCriteriaNotFoundError');
    } catch (error) {
      if (error instanceof ToleranceCriteriaNotFoundError) {
        expect(error.message).toContain('差異種類の許容基準が設定されていません。');
      } else {
        throw error;
      }
    }
  });
});
