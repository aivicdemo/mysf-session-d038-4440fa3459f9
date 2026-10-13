import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-080: 金額差異が閾値を超え整合性スコアが70以上の場合、自動同期を選択', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select automatic_synchronization when amount exceeds threshold and score is high', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);
    mockGetToleranceCriteria.mockResolvedValueOnce({
      discrepancyType: '金額ズレ',
      toleranceAmountThreshold: 100000,
      toleranceRecordCountThreshold: 5,
      toleranceStatusDifference: null,
      severity: 'medium',
    });

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-2024-0580',
        discrepancyType: 'amount' as const,
        amountDifference: 150000,
        countDifference: 3,
        statusDifference: null,
        severity: 'medium' as const,
        rootCauseClassification: 'システムマッピング誤り',
        affectedRecordCount: 3,
        detectionTimestamp: '2024-12-15T09:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 40,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 90,
        rollbackFeasible: true,
        rollbackRecommendationScore: 50,
      },
      impactAnalysis: {
        affectedInvoiceCount: 12,
        affectedSalesOpportunityCount: 8,
        financialImpactAmount: 150000,
        impactedDepartments: [],
        businessContinuityRisk: 'medium' as const,
      },
      executionContext: {
        determinationTimestamp: '2024-12-15T09:30:00Z',
        determinationUserId: 'USER-0045',
        organizationId: 'ORG-001',
      },
    };

    const result = await determineCorrectionMethod(input);

    expect(result.selectedCorrectionMethod).toBe('automatic_synchronization');
    expect(result.methodRationale).toContain('150000');
    expect(result.methodRationale).toContain('100000');
    expect(result.correctionInstruction).toBeDefined();
    expect(result.correctionInstruction.executionProcedure).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.riskLevel).toBe('low');
    expect(result.estimatedExecutionTime).toBe(20);
    expect(result.requiresManualApproval).toBe(false);
  });
});
