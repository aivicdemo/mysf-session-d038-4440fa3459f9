import { determineCorrectionMethod } from '../../src/logic/correction-method-determination-engine';

describe('SCEN-088: 整合性スコアが0～100の範囲外の場合、例外を発生させる', () => {
  it('should throw error when dataIntegrityScore is out of range', async () => {
    const input = {
      discrepancyDetail: {
        discrepancyId: 'DISC-2025-001',
        discrepancyType: 'amount' as const,
        amountDifference: 50000,
        countDifference: 5,
        statusDifference: null,
        severity: 'high' as const,
        rootCauseClassification: 'データ変換エラー',
        affectedRecordCount: 5,
        detectionTimestamp: '2025-02-15T10:30:00Z',
      },
      correctionFeasibilityAssessment: {
        manualCorrectionFeasible: true,
        manualCorrectionRecommendationScore: 60,
        automaticSynchronizationFeasible: true,
        automaticSynchronizationRecommendationScore: 70,
        rollbackFeasible: false,
        rollbackRecommendationScore: 20,
      },
      impactAnalysis: {
        affectedInvoiceCount: 12,
        affectedSalesOpportunityCount: 8,
        financialImpactAmount: 450000,
        impactedDepartments: [],
        businessContinuityRisk: 'medium' as const,
      },
      executionContext: {
        determinationTimestamp: '2025-02-15T10:30:00Z',
        determinationUserId: 'USR-0001',
        organizationId: 'ORG-001',
      },
    };

    await expect(determineCorrectionMethod(input)).rejects.toThrow(
      '整合性スコアは0-100の範囲で指定してください'
    );
  });
});
