import { determineCorrectionMethod, InvalidImpactAnalysisError } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-086: 影響件数が負の値の場合、例外を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidImpactAnalysisError when affectedInvoiceCount is negative', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);
    mockGetToleranceCriteria.mockResolvedValueOnce({
      discrepancyType: 'amount_mismatch',
      toleranceAmount: 100000,
      toleranceRecordCount: 10,
      toleranceStatusDifference: 2,
    });

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-2024-001',
        discrepancyType: 'amount' as const,
        amountDifference: 50000,
        countDifference: 5,
        statusDifference: null,
        severity: 'high' as const,
        rootCauseClassification: 'データ移行エラー',
        affectedRecordCount: 5,
        detectionTimestamp: '2024-01-15T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 60,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 80,
        rollbackFeasible: false,
        rollbackRecommendationScore: 30,
      },
      impactAnalysis: {
        affectedInvoiceCount: -10,
        affectedSalesOpportunityCount: 3,
        financialImpactAmount: 250000,
        impactedDepartments: [],
        businessContinuityRisk: 'medium' as const,
      },
      executionContext: {
        determinationTimestamp: '2024-01-15T10:30:00Z',
        determinationUserId: 'USR-001',
        organizationId: 'ORG-001',
      },
    };

    await expect(determineCorrectionMethod(input)).rejects.toThrow(InvalidImpactAnalysisError);
    await expect(determineCorrectionMethod(input)).rejects.toThrow(
      '影響範囲の分析結果が不完全です。請求書件数、関連案件数、財務影響額は必須です。'
    );
  });
});
