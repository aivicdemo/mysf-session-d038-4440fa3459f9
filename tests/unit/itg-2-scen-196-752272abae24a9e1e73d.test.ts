import { updateMigrationRiskAssessment, InvalidRiskScoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-196: updateMigrationRiskAssessment - InvalidRiskScoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidRiskScoreError when riskEvaluationScore is outside 0-100 range', async () => {
    const riskAssessmentId = 'risk-assess-001';
    const projectId = 'project-001';
    const userId = 'user-003';
    const operationTimestamp = '2026-01-20T14:30:00Z';
    const invalidScore = 150;

    const existingRecord = {
      riskAssessmentId: 'risk-assess-001',
      projectId: 'project-001',
      riskClassification: '技術的リスク',
      riskItemName: 'API互換性',
      riskDescription: '既存APIとの互換性検証が必要',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 75,
      remediationApproach: '軽減',
      remediationStrategy: '互換性レイヤーの実装',
      responsiblePerson: 'user-tech-lead',
      remediationStatus: '進行中',
      remarks: undefined,
      assessorId: 'user-001',
      assessmentTimestamp: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-10T09:00:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-01-14T15:30:00Z',
      updatedBy: 'user-002',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    await expect(
      updateMigrationRiskAssessment({
        riskAssessmentId,
        projectId,
        riskClassification: '技術的リスク',
        riskItemName: 'API互換性',
        occurrencePossibilityLevel: '中',
        impactLevel: '高',
        riskEvaluationScore: invalidScore,
        remediationApproach: '軽減',
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(InvalidRiskScoreError);
  });
});
