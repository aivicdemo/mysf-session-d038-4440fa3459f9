import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import type { DetermineCorrectionMethodInput } from '../../src/logic/correction-method-determination-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-090: 金額差異が手動修正閾値の2倍を超える場合、経理部門の承認が必要と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require manual approval when amount difference exceeds 2x threshold', async () => {
    const input: DetermineCorrectionMethodInput = {
      discrepancyDetail: {
        discrepancyId: 'DISC-2024-001',
        discrepancyType: 'amount',
        amountDifference: 5000000,
        countDifference: 15,
        statusDifference: undefined,
        severity: 'high',
        rootCauseClassification: 'system_calculation_error',
        affectedRecordCount: 15,
        detectionTimestamp: '2024-01-15T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: false,
        manualCorrectionRecommendationScore: 0,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 0.6,
        rollbackFeasible: true,
        rollbackRecommendationScore: 0.9,
      },
      impactAnalysis: {
        affectedInvoiceCount: 42,
        affectedSalesOpportunityCount: 18,
        financialImpactAmount: 5000000,
        impactedDepartments: ['accounting'],
        businessContinuityRisk: 'high',
      },
      executionContext: {
        determinationTimestamp: '2024-01-15T10:30:00Z',
        determinationUserId: 'USER-EXEC-001',
        organizationId: 'ORG-001',
      },
    };

    (
      discrepancyToleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.Mock
    ).mockResolvedValue({
      discrepancyType: 'amount_difference',
      toleranceAmountThreshold: 500000,
      toleranceRecordCountThreshold: 5,
      toleranceStatusDifferenceThreshold: 0,
    });

    const result = await determineCorrectionMethod(input);

    expect(result.requiresManualApproval).toBe(true);
    expect(['exception_escalation', 'rollback']).toContain(result.selectedCorrectionMethod);
    expect(result.methodRationale).toContain('5000000');
    expect(result.methodRationale).toContain('500000');
    expect(result.riskAssessment.riskLevel).toMatch(/high|medium/);
    expect(typeof result.estimatedExecutionTime).toBe('number');
    expect(result.estimatedExecutionTime).toBeGreaterThan(0);
  });
});
