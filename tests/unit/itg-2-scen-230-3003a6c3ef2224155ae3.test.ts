import { deleteMigrationRiskAssessment, DataStoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-230: deleteMigrationRiskAssessment - DataStoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store deletion fails', async () => {
    const riskAssessmentId = 'risk-assessment-uuid-001';
    const projectId = 'project-uuid-001';
    const userId = 'user-uuid-admin';
    const operationTimestamp = '2026-01-15T15:45:00Z';

    // Mock risk assessment record with matching projectId
    const mockRecord = {
      id: 'risk-assessment-uuid-001',
      riskAssessmentId: 'risk-assessment-uuid-001',
      projectId: 'project-uuid-001',
      riskClassification: '技術的リスク',
      riskItemName: 'データ型の不一致',
      riskDescription: 'Oracleの数値型がSalesforceと互換性がない',
      occurrencePossibilityLevel: '高',
      impactLevel: '高',
      riskEvaluationScore: 85,
      remediationApproach: 'マッピング変換ロジックで対応',
      remediationStrategy: '変換スクリプトを実装',
      responsiblePerson: 'user-uuid-tech',
      remediationStatus: '検討中',
      evaluationTimestamp: '2026-01-15T10:30:00Z',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T10:30:00Z',
      createdBy: 'user-uuid-001',
      updatedBy: 'user-uuid-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockRejectedValue(
      new DataStoreError('移行リスク評価レコードの削除に失敗しました。')
    );

    // Call the function and expect it to throw DataStoreError
    await expect(
      deleteMigrationRiskAssessment({
        riskAssessmentId,
        projectId,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(new DataStoreError('移行リスク評価レコードの削除に失敗しました。'));
  });
});
