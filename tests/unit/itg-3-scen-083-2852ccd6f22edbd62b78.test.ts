import { determineCorrectionMethod, InvalidDiscrepancyDetailError } from '../../src/logic/correction-method-determination-engine';

describe('SCEN-083: 差異詳細情報の必須項目欠落時にエラーを発生させる', () => {
  it('should throw InvalidDiscrepancyDetailError when discrepancyDetail is null', async () => {
    const input = {
      discrepancyDetail: null as any,
      correctionFeasibilityAssessment: null as any,
      impactAnalysis: {
        affectedInvoiceCount: 10,
        affectedSalesOpportunityCount: 3,
        financialImpactAmount: 150000,
        impactedDepartments: [],
        businessContinuityRisk: 'low' as const,
      },
      executionContext: {
        determinationTimestamp: '2026-01-15T10:30:00Z',
        determinationUserId: 'system_user',
        organizationId: 'ORG-001',
      },
    };

    await expect(determineCorrectionMethod(input)).rejects.toThrow(InvalidDiscrepancyDetailError);
    await expect(determineCorrectionMethod(input)).rejects.toThrow(
      '差異詳細情報が不完全です。差異種類、金額差異、件数差異、重大度は必須です。'
    );
  });
});
