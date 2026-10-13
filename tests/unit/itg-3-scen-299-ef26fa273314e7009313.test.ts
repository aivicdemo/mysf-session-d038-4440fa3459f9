import { renderDiscrepancyDetailPanel, RenderDiscrepancyDetailPanelOutput } from '../../src/logic/dashboard-presentation';
import * as persistenceModule from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-299: 差異の件数差異がない場合、countDifferenceにnullが設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return output with countDifference as null when there is no count difference', async () => {
    const mockRetrieveDis = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    const mockRetrieveCor = persistenceModule.retrieveCorrectionTrackingByDifferenceId as jest.Mock;
    const mockRetrieveTol = persistenceModule.retrieveToleranceCriteriaByType as jest.Mock;

    const discrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'INV-LEGACY-20250101-001',
      newSystemInvoiceId: 'INV-NEW-20250101-001',
      discrepancyType: '件数差異',
      discrepancyContent: 'No count difference',
      amountDifference: null,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:30:00Z',
      severity: 'info',
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

    const toleranceCriteria = {
      criteriaId: 'criteria-2',
      discrepancyType: '件数差異',
      toleranceAmount: null,
      toleranceCount: 2,
      toleranceStatusDifference: null,
    };

    mockRetrieveTol.mockResolvedValue(toleranceCriteria);

    const input = {
      requestUserId: 'user-001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = await renderDiscrepancyDetailPanel(input);

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.legacyInvoiceId).toBe('INV-LEGACY-20250101-001');
    expect(result.newInvoiceId).toBe('INV-NEW-20250101-001');
    expect(result.discrepancyType).toBe('件数差異');
    expect(result.amountDifference).toBeNull();
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.severity).toBe('info');
    expect(result.detectionDateTime).toEqual(new Date('2025-01-15T10:30:00Z'));
    expect(result.toleranceCriteria.discrepancyType).toBe('件数差異');
    expect(result.toleranceCriteria.toleranceAmount).toBeNull();
    expect(result.toleranceCriteria.toleranceCount).toBe(2);
    expect(result.toleranceCriteria.toleranceStatusDifference).toBeNull();
    expect(result.toleranceJudgment).toBe('within_tolerance');
    expect(result.correctionTrackingHistory).toEqual([]);
  });
});
