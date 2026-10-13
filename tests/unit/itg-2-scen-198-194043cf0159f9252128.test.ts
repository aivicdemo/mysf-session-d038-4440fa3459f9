import { updateMigrationRiskAssessment, InvalidRiskLevelError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-198: リスク影響度レベルが定義済みの値に該当しない場合', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvalidRiskLevelErrorを発生させる', async () => {
    const existingRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      リスク評価ID: '550e8400-e29b-41d4-a716-446655440000',
      移行プロジェクトID: '660e8400-e29b-41d4-a716-446655440001',
      リスク分類: '技術的リスク',
      リスク項目名: 'データ移行スケーラビリティ',
      リスク説明: '大量データ移行時のパフォーマンス問題',
      発生可能性レベル: '中',
      影響度レベル: '高',
      リスク評価スコア: 75,
      対応方針: '軽減',
      対応策: '段階的な移行とテスト計画を実施',
      責任者: 'user-001',
      対応状況: '進行中',
      評価日時: '2026-01-15T10:00:00Z',
      作成日時: '2026-01-15T10:00:00Z',
      更新日時: '2026-01-15T10:00:00Z',
      作成者: 'user-001',
      更新者: 'user-001',
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);

    await expect(
      updateMigrationRiskAssessment({
        riskAssessmentId: '550e8400-e29b-41d4-a716-446655440000',
        projectId: '660e8400-e29b-41d4-a716-446655440001',
        riskClassification: '技術的リスク',
        riskItemName: 'API連携リスク',
        riskDescription: 'Salesforce APIの通信レート制限による連携遅延',
        occurrencePossibilityLevel: '中',
        impactLevel: '無効な値',
        riskEvaluationScore: 60,
        remediationApproach: '軽減',
        remediationStrategy: 'バッチ処理設計の導入',
        responsiblePerson: 'user-002',
        remediationStatus: '未対応',
        remarks: 'Q1中に対応予定',
        userId: 'user-002',
        operationTimestamp: '2026-01-20T14:30:00Z',
      }),
    ).rejects.toThrow(InvalidRiskLevelError);

    expect(mockDataStore.updateRecord).not.toHaveBeenCalled();
  });
});
