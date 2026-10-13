import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-093: ロールバック選択時の優先度が中として出力される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should output priority as medium when rollback is selected', async () => {
    // Mock tolerance criteria
    const mockGetTolerance = discrepancyToleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.MockedFunction<any>;
    mockGetTolerance.mockResolvedValue({
      discrepancyType: 'amount_mismatch',
      toleranceAmountThreshold: 50000,
      toleranceRecordCountThreshold: 3,
      toleranceStatusDifferenceThreshold: 0,
      toleranceCriteriaVersion: '2025-01-01',
    });

    // Prepare inputs from preconditions
    // precondition: discrepancyDetail
    const discrepancyDetail = {
      discrepancyId: 'DISC-20250107-001',
      discrepancyType: 'amount' as const,
      amountDifference: 150000,
      countDifference: 5,
      statusDifference: null,
      severity: 'high' as const,
      rootCauseClassification: 'data_conversion_error',
      affectedRecordCount: 45,
      detectionTimestamp: '2025-01-07T10:35:00Z',
    };

    // precondition: correctionFeasibilityAssessment
    const correctionFeasibilityAssessment = {
      manualCorrectionFeasible: false,
      manualCorrectionRecommendationScore: 0.2,
      automaticSynchronizationFeasible: false,
      automaticSynchronizationRecommendationScore: 0.3,
      rollbackFeasible: true,
      rollbackRecommendationScore: 0.9,
    };

    // precondition: impactAnalysis
    const impactAnalysis = {
      affectedInvoiceCount: 45,
      affectedSalesOpportunityCount: 12,
      financialImpactAmount: 150000,
      impactedDepartments: [],
      businessContinuityRisk: 'high' as const,
    };

    // precondition: executionContext
    const executionContext = {
      determinationTimestamp: '2025-01-07T10:35:00Z',
      determinationUserId: 'system_auto',
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

    // Verify: selectedCorrectionMethod='rollback'
    expect(result.selectedCorrectionMethod).toBe('rollback');

    // Verify: methodRationale includes required content
    expect(result.methodRationale).toContain('ロールバック');

    // Verify: correctionInstruction exists with priority field
    // Note: priority field should be added to CorrectionInstruction interface per SCEN-093 expectation
    expect(result.correctionInstruction).toBeDefined();
    expect((result.correctionInstruction as any).priority).toBe('medium');

    // Verify: riskAssessment has proper fields
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.riskLevel).toBeDefined();

    // Verify: requiresManualApproval=true
    expect(result.requiresManualApproval).toBe(true);

    // Verify: estimatedExecutionTime is positive integer
    expect(result.estimatedExecutionTime).toBeGreaterThan(0);
  });
});
