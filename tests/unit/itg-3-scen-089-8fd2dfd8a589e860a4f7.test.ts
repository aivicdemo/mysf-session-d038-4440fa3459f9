import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import type { DetermineCorrectionMethodInput } from '../../src/logic/correction-method-determination-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-089: ロールバック選択時に経理部門の承認が必要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should determine rollback method and require manual approval when impact scope is comprehensive', async () => {
    const input: DetermineCorrectionMethodInput = {
      discrepancyDetail: {
        discrepancyId: 'DISC-2024-001',
        discrepancyType: 'amount',
        amountDifference: 500000,
        countDifference: 15,
        statusDifference: undefined,
        severity: 'high',
        rootCauseClassification: 'system_migration_error',
        affectedRecordCount: 15,
        detectionTimestamp: '2024-11-15T09:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: false,
        manualCorrectionRecommendationScore: 0,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 0.5,
        rollbackFeasible: true,
        rollbackRecommendationScore: 0.9,
      },
      impactAnalysis: {
        affectedInvoiceCount: 45,
        affectedSalesOpportunityCount: 12,
        financialImpactAmount: 2800000,
        impactedDepartments: [],
        businessContinuityRisk: 'high',
      },
      executionContext: {
        determinationTimestamp: '2024-11-15T09:30:00Z',
        determinationUserId: 'USR-ACC-001',
        organizationId: 'ORG-001',
      },
    };

    (
      discrepancyToleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock
    ).mockResolvedValue({
      discrepancyType: 'amount',
      toleranceAmountThreshold: 100000,
      toleranceRecordCountThreshold: 5,
      toleranceStatusDifferenceThreshold: 0,
    });

    const result = await determineCorrectionMethod(input);

    expect(result.selectedCorrectionMethod).toBe('rollback');
    expect(result.requiresManualApproval).toBe(true);
    expect(result.methodRationale).toContain('500000');
    expect(result.methodRationale).toContain('100000');
    expect(result.correctionInstruction).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(typeof result.estimatedExecutionTime).toBe('number');
    expect(result.estimatedExecutionTime).toBeGreaterThan(0);
  });
});
