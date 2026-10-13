import { updateMigrationRiskAssessment, RiskAssessmentNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-194: updateMigrationRiskAssessment - RiskAssessmentNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw RiskAssessmentNotFoundError when risk assessment record does not exist', async () => {
    const riskAssessmentId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '550e8400-e29b-41d4-a716-446655440001';
    const userId = 'user-12345';
    const operationTimestamp = '2026-10-07T10:30:00Z';

    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(
      updateMigrationRiskAssessment({
        riskAssessmentId,
        projectId,
        riskClassification: '技術的リスク',
        riskItemName: 'APIバージョン互換性',
        occurrencePossibilityLevel: '高',
        impactLevel: '中',
        riskEvaluationScore: 65,
        remediationApproach: '軽減',
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(RiskAssessmentNotFoundError);
  });
});
