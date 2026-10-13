import { determineCorrectionMethod, AmbiguousCorrectionMethodSelectionError } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-084: 複数の是正方法が同等に最適な場合にエラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AmbiguousCorrectionMethodSelectionError when methods have equal scores', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);
    mockGetToleranceCriteria.mockResolvedValueOnce({
      discrepancyType: 'amount_mismatch',
      toleranceAmountThreshold: 100000,
      toleranceRecordCountThreshold: 10,
      toleranceStatusDifference: 'pending',
    });

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-20240115-001',
        discrepancyType: 'amount' as const,
        amountDifference: 50000,
        countDifference: 5,
        statusDifference: 'pending',
        severity: 'high' as const,
        rootCauseClassification: 'システム同期失敗',
        affectedRecordCount: 5,
        detectionTimestamp: '2024-01-15T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 75,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 75,
        rollbackFeasible: true,
        rollbackRecommendationScore: 72,
      },
      impactAnalysis: {
        affectedInvoiceCount: 8,
        affectedSalesOpportunityCount: 3,
        financialImpactAmount: 45000,
        impactedDepartments: [],
        businessContinuityRisk: 'medium' as const,
      },
      executionContext: {
        determinationTimestamp: '2024-01-15T10:30:00Z',
        determinationUserId: 'USR-ACC-001',
        organizationId: 'ORG-001',
      },
    };

    await expect(determineCorrectionMethod(input)).rejects.toThrow(AmbiguousCorrectionMethodSelectionError);
    await expect(determineCorrectionMethod(input)).rejects.toThrow(
      '複数の是正方法が同等に最適です。経理部門による追加判断が必要です。'
    );
  });
});
