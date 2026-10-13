import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-092: 自動同期選択時の優先度が高として出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should output priority as high when automatic_synchronization is selected', async () => {
    // Mock tolerance criteria
    const mockGetTolerance = discrepancyToleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.MockedFunction<any>;
    mockGetTolerance.mockResolvedValue({
      discrepancyType: '金額ズレ',
      toleranceAmountLimit: 50000,
      toleranceCountLimit: 10,
      toleranceStatusDifference: null,
    });

    // Prepare inputs from preconditions mapped to contract types
    // precondition: discrepancyDetail
    const discrepancyDetail = {
      discrepancyId: 'DIF-20250107-001',
      discrepancyType: 'amount' as const,
      amountDifference: 15000,
      countDifference: 3,
      statusDifference: null,
      severity: 'medium' as const,
      rootCauseClassification: 'システム移行時のレート変換誤差',
      affectedRecordCount: 8,
      detectionTimestamp: '2025-01-07T14:30:00Z',
    };

    // precondition: correctionFeasibilityAssessment
    const correctionFeasibilityAssessment = {
      manualCorrectionFeasible: true,
      manualCorrectionRecommendationScore: 0.65,
      automaticSynchronizationFeasible: true,
      automaticSynchronizationRecommendationScore: 0.85,
      rollbackFeasible: true,
      rollbackRecommendationScore: 0.4,
    };

    // precondition: impactAnalysis
    const impactAnalysis = {
      affectedInvoiceCount: 8,
      affectedSalesOpportunityCount: 5,
      financialImpactAmount: 15000,
      impactedDepartments: [],
      businessContinuityRisk: 'low' as const,
    };

    // precondition: executionContext
    const executionContext = {
      determinationTimestamp: '2025-01-07T14:30:00Z',
      determinationUserId: 'USR-ACC-0042',
      organizationId: 'ORG-001',
    };

    const input = {
      discrepancyDetail,
      correctionFeasibilityAssessment,
      impactAnalysis,
      executionContext,
    };

    // Execute the function
    const result = await determineCorrectionMethod(input);

    // Verify: selectedCorrectionMethod='automatic_synchronization'
    expect(result.selectedCorrectionMethod).toBe('automatic_synchronization');

    // Verify: methodRationale includes required content
    expect(result.methodRationale).toContain('15000');
    expect(result.methodRationale).toContain('50000');
    expect(result.methodRationale).toContain('自動同期');

    // Verify: correctionInstruction exists with priority field
    // Note: priority field should be added to CorrectionInstruction interface per SCEN-092 expectation
    expect(result.correctionInstruction).toBeDefined();
    expect((result.correctionInstruction as any).priority).toBe('high');

    // Verify: riskAssessment.riskLevel='low'
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.riskLevel).toBe('low');

    // Verify: estimatedExecutionTime=45
    expect(result.estimatedExecutionTime).toBe(45);

    // Verify: requiresManualApproval=false
    expect(result.requiresManualApproval).toBe(false);
  });
});
