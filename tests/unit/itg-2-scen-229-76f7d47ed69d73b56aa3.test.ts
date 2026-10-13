import { deleteMigrationRiskAssessment, ProjectContextMismatchError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-229: deleteMigrationRiskAssessment - ProjectContextMismatchError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextMismatchError when risk assessment projectId does not match input projectId', async () => {
    const riskAssessmentId = 'risk-uuid-001';
    const projectId = 'project-uuid-001';
    const userId = 'user-003';
    const operationTimestamp = '2025-01-20T14:45:00Z';

    // Mock risk assessment record with different projectId
    const mockRecord = {
      id: 'risk-uuid-001',
      riskAssessmentId: 'risk-uuid-001',
      projectId: 'project-uuid-999',
      riskClassification: '技術的リスク',
      riskItemName: 'API互換性問題',
      riskDescription: '既存APIとの互換性が不足している可能性',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 75,
      remediationApproach: '段階的移行',
      remediationStrategy: '互換性ラッパーの実装',
      responsiblePerson: '技術責任者',
      remediationStatus: '検討中',
      evaluationTimestamp: '2025-01-15T10:30:00Z',
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-002',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);

    // Call the function and expect it to throw ProjectContextMismatchError
    await expect(
      deleteMigrationRiskAssessment({
        riskAssessmentId,
        projectId,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(new ProjectContextMismatchError('指定されたレコードは現在のプロジェクトに属していません。'));
  });
});
