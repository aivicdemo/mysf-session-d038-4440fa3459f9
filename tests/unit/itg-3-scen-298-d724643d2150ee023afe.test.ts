import { renderDiscrepancyDetailPanel, RenderDiscrepancyDetailPanelOutput } from '../../src/logic/dashboard-presentation';
import * as persistenceModule from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-298: 差異の金額差異がない場合、amountDifferenceにnullが設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return output with amountDifference as null when there is no amount difference', async () => {
    const mockRetrieveDis = persistenceModule.retrieveDiscrepancyDetailsForConfirmation as jest.Mock;
    const mockRetrieveCor = persistenceModule.retrieveCorrectionTrackingByDifferenceId as jest.Mock;
    const mockRetrieveTol = persistenceModule.retrieveToleranceCriteriaByType as jest.Mock;

    const discrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'SF-INV-2024-001',
      newSystemInvoiceId: 'NEW-INV-2024-001',
      discrepancyType: '金額差異',
      discrepancyContent: 'No amount difference',
      amountDifference: null,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2024-11-15T10:30:00Z',
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
      criteriaId: 'criteria-1',
      discrepancyType: '金額差異',
      toleranceAmount: 1000,
      toleranceCount: null,
      toleranceStatusDifference: null,
    };

    mockRetrieveTol.mockResolvedValue(toleranceCriteria);

    const input = {
      requestUserId: 'user-001',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = await renderDiscrepancyDetailPanel(input);

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.legacyInvoiceId).toBe('SF-INV-2024-001');
    expect(result.newInvoiceId).toBe('NEW-INV-2024-001');
    expect(result.discrepancyType).toBe('金額差異');
    expect(result.amountDifference).toBeNull();
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.severity).toBe('info');
    expect(result.detectionDateTime).toEqual(new Date('2024-11-15T10:30:00Z'));
    expect(result.toleranceJudgment).toBe('within_tolerance');
    expect(result.correctionTrackingHistory).toEqual([]);
  });
});
