import { updateMigrationRiskAssessment, MigrationRiskAssessmentRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-202: 操作監査証跡として更新操作をrecordOperationAuditTrailに記録する', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recordOperationAuditTrailが正しい内容で呼ばれる', async () => {
    const existingRecord = {
      id: 'uuid-risk-001',
      uuid: 'uuid-risk-001',
      リスク評価ID: 'uuid-risk-001',
      移行プロジェクトID: 'uuid-proj-123',
      リスク分類: '技術的リスク',
      リスク項目名: 'Salesforce API互換性',
      リスク説明: '既存Salesforce APIがリプレース先で非対応の可能性',
      発生可能性レベル: '中',
      影響度レベル: '高',
      リスク評価スコア: 65,
      対応方針: '軽減',
      対応策: '事前にAPI互換性調査を実施',
      責任者: 'tech-lead-001',
      対応状況: '未対応',
      備考: '初期評価',
      評価日時: '2026-01-15T10:00:00Z',
      作成日時: '2026-01-15T10:00:00Z',
      更新日時: '2026-01-15T10:00:00Z',
      作成者: 'user-initial',
      更新者: 'user-initial',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    };

    const updatedRecord: MigrationRiskAssessmentRecord = {
      riskAssessmentId: 'uuid-risk-001',
      projectId: 'uuid-proj-123',
      riskClassification: '技術的リスク',
      riskItemName: 'Salesforce API互換性',
      riskDescription: '既存Salesforce APIがリプレース先で非対応の可能性が存在',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 72,
      remediationApproach: '軽減',
      remediationStrategy: '事前にAPI互換性調査を実施し、代替手段を準備',
      responsiblePerson: 'tech-lead-001',
      remediationStatus: '進行中',
      remarks: '2026年1月20日の定期レビューで更新',
      assessorId: 'user-initial',
      assessmentTimestamp: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-15T10:00:00Z',
      createdBy: 'user-initial',
      updatedAt: '2026-01-20T14:30:00Z',
      updatedBy: 'user-reviewer-002',
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockResolvedValue(updatedRecord);
    mockDataStore.createRecord.mockResolvedValue({
      id: 'audit-001',
      auditTrailId: 'audit-001',
      userId: 'user-reviewer-002',
      operationType: '更新',
      targetTableName: 'migration_risk_assessment',
      targetRecordId: 'uuid-risk-001',
      changeBeforeValue: JSON.stringify({ riskEvaluationScore: 65, remediationStatus: '未対応' }),
      changeAfterValue: JSON.stringify({ riskEvaluationScore: 72, remediationStatus: '進行中' }),
      operationDetails: 'リスク評価スコア、対応状況を更新',
      operationStatus: '成功',
      operationTimestamp: '2026-01-20T14:30:00Z',
      createdAt: '2026-01-20T14:30:00Z',
    });

    const result = await updateMigrationRiskAssessment({
      riskAssessmentId: 'uuid-risk-001',
      projectId: 'uuid-proj-123',
      riskClassification: '技術的リスク',
      riskItemName: 'Salesforce API互換性',
      riskDescription: '既存Salesforce APIがリプレース先で非対応の可能性が存在',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 72,
      remediationApproach: '軽減',
      remediationStrategy: '事前にAPI互換性調査を実施し、代替手段を準備',
      responsiblePerson: 'tech-lead-001',
      remediationStatus: '進行中',
      remarks: '2026年1月20日の定期レビューで更新',
      userId: 'user-reviewer-002',
      operationTimestamp: '2026-01-20T14:30:00Z',
    });

    expect(result.riskAssessmentId).toBe('uuid-risk-001');
    expect(result.projectId).toBe('uuid-proj-123');
    expect(result.riskEvaluationScore).toBe(72);
    expect(result.remediationStatus).toBe('進行中');
    expect(result.updatedAt).toBe('2026-01-20T14:30:00Z');
    expect(result.updatedBy).toBe('user-reviewer-002');
  });
});
