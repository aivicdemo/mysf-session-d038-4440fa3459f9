import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-082: 影響範囲が全体に及ぶ場合、ロールバックを選択してリスク評価を含む指示内容を生成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select rollback when impact scope is organization-wide', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);
    mockGetToleranceCriteria.mockResolvedValueOnce({
      discrepancyType: 'amount_mismatch',
      toleranceAmount: 100000,
      toleranceRecordCount: 50,
      toleranceStatusDifference: 'reconciled_within_30days',
    });

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-20250101-001',
        discrepancyType: 'amount' as const,
        amountDifference: 5000000,
        countDifference: 250,
        statusDifference: 'pending_vs_completed',
        severity: 'critical' as const,
        rootCauseClassification: 'システム移行エラー',
        affectedRecordCount: 250,
        detectionTimestamp: '2025-01-01T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: false,
        manualCorrectionRecommendationScore: 0,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 40,
        rollbackFeasible: true,
        rollbackRecommendationScore: 95,
      },
      impactAnalysis: {
        affectedInvoiceCount: 1250,
        affectedSalesOpportunityCount: 480,
        financialImpactAmount: 5000000,
        impactedDepartments: ['営業部', '経理部', '請求部'],
        businessContinuityRisk: 'critical' as const,
      },
      executionContext: {
        determinationTimestamp: '2025-01-01T10:30:00Z',
        determinationUserId: 'USR-20250101-ADMIN',
        organizationId: 'ORG-001',
      },
    };

    const result = await determineCorrectionMethod(input);

    expect(result.selectedCorrectionMethod).toBe('rollback');
    expect(result.methodRationale).toContain('5000000');
    expect(result.methodRationale).toContain('100000');
    expect(result.correctionInstruction).toBeDefined();
    expect(result.correctionInstruction.executionProcedure).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.riskLevel).toBe('high');
    expect(result.estimatedExecutionTime).toBe(180);
    expect(result.requiresManualApproval).toBe(true);
  });
});
