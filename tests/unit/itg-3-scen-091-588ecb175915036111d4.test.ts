import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import type { DetermineCorrectionMethodInput } from '../../src/logic/correction-method-determination-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-091: 手動修正選択時の優先度が高として出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select manual_correction and set requiresManualApproval to false when within tolerance', async () => {
    const input: DetermineCorrectionMethodInput = {
      discrepancyDetail: {
        discrepancyId: 'DISC-20250215-001',
        discrepancyType: 'amount',
        amountDifference: 45000,
        countDifference: 3,
        statusDifference: undefined,
        severity: 'medium',
        rootCauseClassification: 'データ変換エラー',
        affectedRecordCount: 3,
        detectionTimestamp: '2025-02-15T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 0.9,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 0.6,
        rollbackFeasible: true,
        rollbackRecommendationScore: 0.3,
      },
      impactAnalysis: {
        affectedInvoiceCount: 8,
        affectedSalesOpportunityCount: 5,
        financialImpactAmount: 45000,
        impactedDepartments: [],
        businessContinuityRisk: 'low',
      },
      executionContext: {
        determinationTimestamp: '2025-02-15T10:30:00Z',
        determinationUserId: 'USR-ACC-0001',
        organizationId: 'ORG-SF-001',
      },
    };

    (
      discrepancyToleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock
    ).mockResolvedValue({
      discrepancyType: '金額ズレ',
      toleranceAmountThreshold: 50000,
      toleranceRecordCountThreshold: 5,
      toleranceStatusDifferenceThreshold: 0,
    });

    const result = await determineCorrectionMethod(input);

    expect(result.selectedCorrectionMethod).toBe('manual_correction');
    expect(result.methodRationale).toContain('45000');
    expect(result.methodRationale).toContain('50000');
    expect(result.correctionInstruction).toBeDefined();
    expect(result.correctionInstruction.targetRecordIdentifiers).toBeDefined();
    expect(result.riskAssessment.riskLevel).toBe('low');
    expect(result.estimatedExecutionTime).toBe(90);
    expect(result.requiresManualApproval).toBe(false);
  });
});
