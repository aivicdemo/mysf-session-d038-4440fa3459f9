import { updateMigrationRiskAssessment, ProjectContextMismatchError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-195: updateMigrationRiskAssessment - ProjectContextMismatchError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextMismatchError when projectId does not match existing record', async () => {
    const riskAssessmentId = 'risk-assessment-001';
    const inputProjectId = 'project-uuid-bbb';
    const recordProjectId = 'project-uuid-aaa';
    const userId = 'user-002';
    const operationTimestamp = '2026-01-16T14:30:00Z';

    const existingRecord = {
      riskAssessmentId: 'risk-assessment-001',
      projectId: recordProjectId,
      riskClassification: '技術的リスク',
      riskItemName: 'API互換性',
      riskDescription: '既存APIの非互換性',
      occurrencePossibilityLevel: '高',
      impactLevel: '高',
      riskEvaluationScore: 75,
      remediationApproach: '軽減',
      remediationStrategy: '段階的な移行',
      responsiblePerson: 'user-tech-lead',
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
        projectId: inputProjectId,
        riskClassification: 'データリスク',
        riskItemName: 'データマッピング',
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(ProjectContextMismatchError);

    expect(dataStore.listRecords).toHaveBeenCalled();
  });
});
