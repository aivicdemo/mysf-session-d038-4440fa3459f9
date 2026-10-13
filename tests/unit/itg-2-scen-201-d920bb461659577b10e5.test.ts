import { updateMigrationRiskAssessment, MigrationRiskAssessmentRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-201: 更新操作の実行日時と実行ユーザーのIDを新しい値で記録する', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updatedAtとupdatedByが新しい値で記録される', async () => {
    const existingRecord = {
      id: 'risk-assess-001',
      uuid: 'risk-assess-001',
      リスク評価ID: 'risk-assess-001',
      移行プロジェクトID: 'proj-001',
      リスク分類: '技術的リスク',
      リスク項目名: 'データ型の不整合',
      リスク説明: 'Oracleの数値型とSalesforceの数値型の変換ロジック不備',
      発生可能性レベル: '中',
      影響度レベル: '高',
      リスク評価スコア: 65,
      対応方針: '軽減',
      対応策: '変換ロジックの事前検証と段階的移行',
      責任者: 'user-002',
      対応状況: '進行中',
      評価日時: '2026-01-15T10:00:00Z',
      作成日時: '2026-01-10T09:00:00Z',
      更新日時: '2026-01-15T10:00:00Z',
      作成者: 'user-002',
      更新者: 'user-002',
    };

    const updatedRecord: MigrationRiskAssessmentRecord = {
      riskAssessmentId: 'risk-assess-001',
      projectId: 'proj-001',
      riskClassification: 'データリスク',
      riskItemName: '請求明細レコード数超過',
      riskDescription: '移行対象システムの請求明細が1000万件を超える場合のパフォーマンス低下',
      occurrencePossibilityLevel: '高',
      impactLevel: '中',
      riskEvaluationScore: 72,
      remediationApproach: '軽減',
      remediationStrategy: 'アーカイブ戦略の導入と段階的なバッチ処理による移行',
      responsiblePerson: 'user-003',
      remediationStatus: '進行中',
      remarks: '2026年2月末までに対応方針を確定予定',
      assessorId: 'user-002',
      assessmentTimestamp: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-10T09:00:00Z',
      createdBy: 'user-002',
      updatedAt: '2026-01-20T14:30:45Z',
      updatedBy: 'user-004',
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockResolvedValue(updatedRecord);

    const result = await updateMigrationRiskAssessment({
      riskAssessmentId: 'risk-assess-001',
      projectId: 'proj-001',
      riskClassification: 'データリスク',
      riskItemName: '請求明細レコード数超過',
      riskDescription: '移行対象システムの請求明細が1000万件を超える場合のパフォーマンス低下',
      occurrencePossibilityLevel: '高',
      impactLevel: '中',
      riskEvaluationScore: 72,
      remediationApproach: '軽減',
      remediationStrategy: 'アーカイブ戦略の導入と段階的なバッチ処理による移行',
      responsiblePerson: 'user-003',
      remediationStatus: '進行中',
      remarks: '2026年2月末までに対応方針を確定予定',
      userId: 'user-004',
      operationTimestamp: '2026-01-20T14:30:45Z',
    });

    expect(result.riskAssessmentId).toBe('risk-assess-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.riskClassification).toBe('データリスク');
    expect(result.riskItemName).toBe('請求明細レコード数超過');
    expect(result.riskDescription).toBe('移行対象システムの請求明細が1000万件を超える場合のパフォーマンス低下');
    expect(result.occurrencePossibilityLevel).toBe('高');
    expect(result.impactLevel).toBe('中');
    expect(result.riskEvaluationScore).toBe(72);
    expect(result.remediationApproach).toBe('軽減');
    expect(result.remediationStrategy).toBe('アーカイブ戦略の導入と段階的なバッチ処理による移行');
    expect(result.responsiblePerson).toBe('user-003');
    expect(result.remediationStatus).toBe('進行中');
    expect(result.remarks).toBe('2026年2月末までに対応方針を確定予定');
    expect(result.updatedAt).toBe('2026-01-20T14:30:45Z');
    expect(result.updatedBy).toBe('user-004');
    expect(result.createdAt).toBe('2026-01-10T09:00:00Z');
    expect(result.createdBy).toBe('user-002');
    expect(result.assessorId).toBe('user-002');
    expect(result.assessmentTimestamp).toBe('2026-01-15T10:00:00Z');
  });
});
