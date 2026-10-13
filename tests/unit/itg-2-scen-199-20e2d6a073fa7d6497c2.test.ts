import { updateMigrationRiskAssessment, DataStoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-199: データストアが更新操作に失敗した場合', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataStoreErrorを発生させる', async () => {
    const existingRecord = {
      id: 'risk-assess-001',
      uuid: 'risk-assess-001',
      移行プロジェクトID: 'project-001',
      リスク分類: '技術的リスク',
      リスク項目名: 'API互換性',
      リスク説明: 'Salesforce REST APIの互換性問題',
      発生可能性レベル: '中',
      影響度レベル: '高',
      リスク評価スコア: 65,
      対応方針: '軽減',
      対応策: '互換性テストの実施',
      責任者: '田中太郎',
      対応状況: '進行中',
      評価日時: '2025-06-01T10:00:00Z',
      作成日時: '2025-06-01T10:00:00Z',
      更新日時: '2025-06-01T10:00:00Z',
      作成者: 'user-001',
      更新者: 'user-001',
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockRejectedValue(
      new dataStore.DataStoreError('リスク評価の更新に失敗しました。'),
    );

    await expect(
      updateMigrationRiskAssessment({
        riskAssessmentId: 'risk-assess-001',
        projectId: 'project-001',
        riskClassification: 'データリスク',
        riskItemName: 'データ移行精度',
        riskDescription: 'レガシーシステムからのデータ移行における精度低下',
        occurrencePossibilityLevel: '高',
        impactLevel: '高',
        riskEvaluationScore: 80,
        remediationApproach: '軽減',
        remediationStrategy: 'データ品質チェック体制の構築',
        responsiblePerson: '鈴木花子',
        remediationStatus: '未対応',
        remarks: '移行前の詳細なデータ監査が必須',
        userId: 'user-002',
        operationTimestamp: '2025-06-15T14:30:00Z',
      }),
    ).rejects.toThrow(DataStoreError);

    expect(mockDataStore.updateRecord).toHaveBeenCalled();
  });
});
