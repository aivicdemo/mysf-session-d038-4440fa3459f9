import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-094: 件数が閾値を超える場合、自動同期またはロールバックの判定ロジックが働く', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select automatic_synchronization when record count exceeds threshold', async () => {
    // Mock tolerance criteria
    const mockGetTolerance = discrepancyToleranceCriteria.getToleranceCriteriaByDiscrepancyType as jest.MockedFunction<any>;
    mockGetTolerance.mockResolvedValue({
      max_tolerance_amount: 100000,
      max_tolerance_record_count: 20,
      severity_threshold: 'high',
    });

    // Prepare inputs from preconditions
    // precondition: discrepancyDetail
    const discrepancyDetail = {
      discrepancyId: 'DISC-20240115-001',
      discrepancyType: 'amount' as const,
      amountDifference: 150000,
      countDifference: 25,
      statusDifference: null,
      severity: 'high' as const,
      rootCauseClassification: 'system_migration_issue',
      affectedRecordCount: 25,
      detectionTimestamp: '2024-01-15T09:30:00Z',
    };

    // precondition: correctionFeasibilityAssessment
    const correctionFeasibilityAssessment = {
      manualCorrectionFeasible: false,
      manualCorrectionRecommendationScore: 0.2,
      automaticSynchronizationFeasible: true,
      automaticSynchronizationRecommendationScore: 0.85,
      rollbackFeasible: true,
      rollbackRecommendationScore: 0.6,
    };

    // precondition: impactAnalysis
    const impactAnalysis = {
      affectedInvoiceCount: 25,
      affectedSalesOpportunityCount: 12,
      financialImpactAmount: 150000,
      impactedDepartments: [],
      businessContinuityRisk: 'medium' as const,
    };

    // precondition: executionContext
    const executionContext = {
      determinationTimestamp: '2024-01-15T09:30:00Z',
      determinationUserId: 'system_admin',
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

    // Verify: methodRationale includes threshold comparisons and amounts
    expect(result.methodRationale).toContain('自動同期');
    expect(result.methodRationale).toContain('150000');
    expect(result.methodRationale).toContain('100000');

    // Verify: correctionInstruction has proper structure
    expect(result.correctionInstruction).toBeDefined();
    expect(result.correctionInstruction.targetRecordIdentifiers).toBeDefined();
    expect(result.correctionInstruction.targetRecordIdentifiers.length).toBe(25);
    expect(result.correctionInstruction.executionProcedure).toBeDefined();
    expect(result.correctionInstruction.verificationCheckpoints).toBeDefined();

    // Verify: requiresManualApproval=false
    expect(result.requiresManualApproval).toBe(false);

    // Verify: riskAssessment.riskType='data_consistency'
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.riskType).toBe('data_consistency');

    // Verify: estimatedExecutionTime is in 30-60 minute range
    expect(result.estimatedExecutionTime).toBeGreaterThanOrEqual(30);
    expect(result.estimatedExecutionTime).toBeLessThanOrEqual(60);
  });
});
