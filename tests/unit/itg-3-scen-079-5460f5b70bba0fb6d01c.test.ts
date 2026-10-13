import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-079: 金額差異が閾値以下で件数が少ない場合、手動修正を選択', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select manual_correction when amount and count are below threshold', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);
    mockGetToleranceCriteria.mockResolvedValueOnce({
      discrepancyType: '金額ズレ',
      toleranceAmountThreshold: 100000,
      toleranceRecordCountThreshold: 10,
      toleranceStatusDiscrepancy: null,
      isActive: true,
    });

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-20250207-001',
        discrepancyType: 'amount' as const,
        amountDifference: 45000,
        countDifference: 3,
        statusDifference: null,
        severity: 'low' as const,
        rootCauseClassification: 'データ入力誤り',
        affectedRecordCount: 3,
        detectionTimestamp: '2025-02-07T10:30:00Z',
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
        financialImpactAmount: 45000,
        impactedDepartments: [],
        businessContinuityRisk: 'low' as const,
      },
      executionContext: {
        determinationTimestamp: '2025-02-07T10:30:00Z',
        determinationUserId: 'USER-001',
        organizationId: 'ORG-001',
      },
    };

    const result = await determineCorrectionMethod(input);

    expect(result.selectedCorrectionMethod).toBe('manual_correction');
    expect(result.methodRationale).toContain('45000');
    expect(result.methodRationale).toContain('100000');
    expect(result.correctionInstruction).toBeDefined();
    expect(result.correctionInstruction.executionProcedure).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.riskLevel).toBe('low');
    expect(result.estimatedExecutionTime).toBe(120);
    expect(result.requiresManualApproval).toBe(false);
  });
});
