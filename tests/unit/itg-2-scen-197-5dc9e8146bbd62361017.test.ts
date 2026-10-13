import { updateMigrationRiskAssessment, InvalidRiskLevelError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-197: updateMigrationRiskAssessment - InvalidRiskLevelError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidRiskLevelError when occurrencePossibilityLevel is not a defined value', async () => {
    const riskAssessmentId = '550e8400-e29b-41d4-a716-446655440001';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = 'user-002';
    const operationTimestamp = '2026-01-20T14:30:00Z';
    const invalidLevel = '超高';

    const existingRecord = {
      riskAssessmentId: '550e8400-e29b-41d4-a716-446655440001',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      riskClassification: '技術的リスク',
      riskItemName: 'API互換性',
      riskDescription: '既存APIの廃止によるシステム連携の影響',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 75,
      remediationApproach: '軽減',
      remediationStrategy: '代替APIの検証を実施',
      responsiblePerson: 'user-001',
      remediationStatus: '進行中',
      remarks: undefined,
      assessorId: 'user-001',
      assessmentTimestamp: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-15T10:00:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-01-15T10:00:00Z',
      updatedBy: 'user-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    await expect(
      updateMigrationRiskAssessment({
        riskAssessmentId,
        projectId,
        occurrencePossibilityLevel: invalidLevel,
        impactLevel: '高',
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(InvalidRiskLevelError);
  });
});
