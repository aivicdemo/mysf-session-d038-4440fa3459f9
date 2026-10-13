import { renderDiscrepancyDetailPanel } from '../../src/logic/dashboard-presentation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
  retrieveCorrectionTrackingByDifferenceId: jest.fn(),
  retrieveToleranceCriteriaByType: jest.fn(),
}));

describe('SCEN-301: renderDiscrepancyDetailPanel - 関連する是正追跡管理レコードが0件の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('関連する是正追跡管理レコードが0件の場合、空配列が出力される', async () => {
    const requestUserId = 'user-001';
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetail = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      discrepancyDetection: {
        discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
        legacySystemInvoiceId: 'SF-INV-20250101-001',
        newSystemInvoiceId: 'NEW-INV-20250101-001',
        discrepancyType: '金額差異',
        discrepancyContent: 'Amount mismatch detected',
        amountDifference: 15000,
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

    const toleranceCriteria = {
      criteriaId: 'crit-001',
      discrepancyType: '金額差異',
      toleranceAmount: 20000,
      toleranceCount: null,
      toleranceStatusDifference: null,
    };

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue(discrepancyDetail);
    (discrepancyPersistence.retrieveCorrectionTrackingByDifferenceId as jest.Mock).mockResolvedValue([]);
    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(toleranceCriteria);

    const result = await renderDiscrepancyDetailPanel({
      requestUserId,
      discrepancyId,
    });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.legacyInvoiceId).toBe('SF-INV-20250101-001');
    expect(result.newInvoiceId).toBe('NEW-INV-20250101-001');
    expect(result.discrepancyType).toBe('金額差異');
    expect(result.amountDifference).toBe(15000);
    expect(result.countDifference).toBe(null);
    expect(result.statusDifference).toBe(null);
    expect(result.severity).toBe('warning');
    expect(result.detectionDateTime).toEqual(new Date('2025-01-15T10:30:00Z'));
    expect(result.toleranceCriteria.toleranceAmount).toBe(20000);
    expect(result.toleranceJudgment).toBe('within_tolerance');
    expect(result.correctionTrackingHistory).toEqual([]);
  });
});
