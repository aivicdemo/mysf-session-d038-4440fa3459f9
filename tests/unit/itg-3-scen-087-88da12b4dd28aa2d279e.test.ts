import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-087: 金額差異が負の値の場合、絶対値として処理して是正方法を判定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process negative amount difference as absolute value', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);
    mockGetToleranceCriteria.mockResolvedValueOnce({
      discrepancyType: 'amount_mismatch',
      toleranceAmount: 10000,
      toleranceRecordCountThreshold: 5,
      toleranceStatusDifference: 0,
    });

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-20250107-001',
        discrepancyType: 'amount' as const,
        amountDifference: -15000,
        countDifference: 3,
        statusDifference: null,
        severity: 'medium' as const,
        rootCauseClassification: 'システム変換エラー',
        affectedRecordCount: 3,
        detectionTimestamp: '2025-01-07T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 85,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 60,
        rollbackFeasible: false,
        rollbackRecommendationScore: 0,
      },
      impactAnalysis: {
        affectedInvoiceCount: 3,
        affectedSalesOpportunityCount: 2,
        financialImpactAmount: 15000,
        impactedDepartments: [],
        businessContinuityRisk: 'low' as const,
      },
      executionContext: {
        determinationTimestamp: '2025-01-07T10:30:00Z',
        determinationUserId: 'USR-20250107-AUDIT001',
        organizationId: 'ORG-20250107-MAIN',
      },
    };

    const result = await determineCorrectionMethod(input);

    expect(result.selectedCorrectionMethod).toBe('manual_correction');
    expect(result.methodRationale).toContain('15000');
    expect(result.methodRationale).toContain('10000');
    expect(result.correctionInstruction).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.estimatedExecutionTime).toBe(120);
    expect(result.requiresManualApproval).toBe(true);
  });
});
