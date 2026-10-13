import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-081: 金額差異が閾値を超え整合性スコアが70未満の場合、ロールバックを選択', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select rollback when amount exceeds threshold and rollback score is highest', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);
    mockGetToleranceCriteria.mockResolvedValueOnce({
      discrepancyType: 'amount_mismatch',
      toleranceAmountThreshold: 500000,
      toleranceCountThreshold: 3,
      toleranceStatusDiscrepancy: null,
    });

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-20250107-001',
        discrepancyType: 'amount' as const,
        amountDifference: 850000,
        countDifference: 5,
        statusDifference: null,
        severity: 'high' as const,
        rootCauseClassification: 'システムマッピング誤り',
        affectedRecordCount: 5,
        detectionTimestamp: '2025-01-07T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 40,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 30,
        rollbackFeasible: true,
        rollbackRecommendationScore: 90,
      },
      impactAnalysis: {
        affectedInvoiceCount: 12,
        affectedSalesOpportunityCount: 8,
        financialImpactAmount: 850000,
        impactedDepartments: [],
        businessContinuityRisk: 'high' as const,
      },
      executionContext: {
        determinationTimestamp: '2025-01-07T10:30:00Z',
        determinationUserId: 'USR-20250107-ADMIN001',
        organizationId: 'ORG-SALES-001',
      },
    };

    const result = await determineCorrectionMethod(input);

    expect(result.selectedCorrectionMethod).toBe('rollback');
    expect(result.methodRationale).toContain('850000');
    expect(result.methodRationale).toContain('500000');
    expect(result.correctionInstruction).toBeDefined();
    expect(result.correctionInstruction.executionProcedure).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.riskLevel).toBe('high');
    expect(result.estimatedExecutionTime).toBeGreaterThanOrEqual(120);
    expect(result.estimatedExecutionTime).toBeLessThanOrEqual(180);
    expect(result.requiresManualApproval).toBe(true);
  });
});
