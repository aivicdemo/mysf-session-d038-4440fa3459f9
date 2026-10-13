import { updateMigrationRiskAssessment, RiskAssessmentNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-203: 設計済みエラー it-tco-002-1 の条件に該当する場合', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('RiskAssessmentNotFoundErrorが発生する', async () => {
    const existingRecord = {
      id: 'uuid-risk-001',
      リスク評価ID: 'uuid-risk-001',
      移行プロジェクトID: 'uuid-proj-001',
      リスク分類: '技術的リスク',
      リスク項目名: 'API統合の複雑性',
      リスク説明: '既存のカスタムAPI連携が複雑である',
      発生可能性レベル: '高',
      影響度レベル: '高',
      リスク評価スコア: 85,
      対応方針: '軽減',
      対応策: '段階的なAPI移行計画を策定',
      責任者: 'user-tech-lead',
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
        riskAssessmentId: 'uuid-risk-notfound',
        projectId: 'uuid-proj-001',
        riskClassification: 'データリスク',
        riskItemName: 'カスタムフィールドマッピング',
        riskDescription: '請求書・請求明細カスタムオブジェクトの全フィールドがターゲットシステムにマップできない可能性',
        occurrencePossibilityLevel: '中',
        impactLevel: '中',
        riskEvaluationScore: 75,
        remediationApproach: '軽減',
        remediationStrategy: 'カスタムフィールド手入力記録テーブルを利用した段階的マッピング',
        responsiblePerson: 'user-data-lead',
        remediationStatus: '進行中',
        remarks: '初期段階での検証が重要',
        userId: 'user-002',
        operationTimestamp: '2026-01-20T14:30:00Z',
      }),
    ).rejects.toThrow(RiskAssessmentNotFoundError);

    expect(mockDataStore.updateRecord).not.toHaveBeenCalled();
  });
});
