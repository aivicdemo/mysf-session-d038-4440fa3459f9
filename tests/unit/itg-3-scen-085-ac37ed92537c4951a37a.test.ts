import { determineCorrectionMethod, InvalidDiscrepancyDetailError } from '../../src/logic/correction-method-determination-engine';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/discrepancy-tolerance-criteria');

describe('SCEN-085: 差異種類が空または不明な場合、例外を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidDiscrepancyDetailError when discrepancyType is empty string', async () => {
    const mockGetToleranceCriteria = jest.spyOn(toleranceCriteria, 'getToleranceCriteriaByDiscrepancyType' as any);

    const input = {
      discrepancyDetail: {
        discrepancyId: 'DIF-20250107-001',
        discrepancyType: '' as any,
        amountDifference: 15000,
        countDifference: 3,
        statusDifference: 'pending',
        severity: 'high' as const,
        rootCauseClassification: 'システム移行',
        affectedRecordCount: 3,
        detectionTimestamp: '2025-01-07T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 80,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 70,
        rollbackFeasible: true,
        rollbackRecommendationScore: 60,
      },
      impactAnalysis: {
        affectedInvoiceCount: 5,
        affectedSalesOpportunityCount: 2,
        financialImpactAmount: 15000,
        impactedDepartments: [],
        businessContinuityRisk: 'low' as const,
      },
      executionContext: {
        determinationTimestamp: '2025-01-07T10:30:00Z',
        determinationUserId: 'system_user_001',
        organizationId: 'ORG-001',
      },
    };

    await expect(determineCorrectionMethod(input)).rejects.toThrow(InvalidDiscrepancyDetailError);
    await expect(determineCorrectionMethod(input)).rejects.toThrow(
      '差異詳細情報が不完全です。差異種類、金額差異、件数差異、重大度は必須です。'
    );
  });
});
