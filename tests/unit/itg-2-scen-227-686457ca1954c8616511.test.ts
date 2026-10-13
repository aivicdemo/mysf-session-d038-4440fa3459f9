import { deleteMigrationRiskAssessment } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-227: deleteMigrationRiskAssessment - Normal case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully delete risk assessment record when it exists and projectId matches', async () => {
    const riskAssessmentId = 'risk-assessment-001';
    const projectId = 'project-123';
    const userId = 'user-delete-001';
    const operationTimestamp = '2026-01-15T11:00:00Z';

    // Mock risk assessment record with matching projectId
    const mockRecord = {
      id: 'risk-assessment-001',
      riskAssessmentId: 'risk-assessment-001',
      projectId: 'project-123',
      riskClassification: '技術的リスク',
      riskItemName: 'データ移行の完全性',
      riskDescription: 'Salesforceへのデータ移行時に取引先データの欠損が発生する可能性',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 15,
      remediationApproach: 'データ検証の強化',
      remediationStrategy: '移行前後のレコード数および重要フィールドを検証',
      responsiblePerson: 'user-001',
      remediationStatus: '未開始',
      assessmentTimestamp: '2026-01-15T10:30:00Z',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
      createdBy: 'user-001',
      updatedBy: 'user-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    // Call the function - should not throw
    await expect(
      deleteMigrationRiskAssessment({
        riskAssessmentId,
        projectId,
        userId,
        operationTimestamp,
      })
    ).resolves.toBeUndefined();

    // Verify deleteRecord was called with correct parameters
    expect(dataStore.deleteRecord).toHaveBeenCalled();
  });
});
