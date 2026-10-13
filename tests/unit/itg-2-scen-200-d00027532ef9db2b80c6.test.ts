import { updateMigrationRiskAssessment, MigrationRiskAssessmentRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-200: 更新可能な項目を選択的に更新する', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新されなかった項目は既存の値を保持する', async () => {
    const existingRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      'varchar(100)': 'user-123',
      text: '既存システム連携用APIレイヤーの構築',
      integer: 85,
      timestamp: '2026-01-15T10:00:00Z',
      リスク説明: '既存システムとの技術スタック非互換性による統合困難',
      責任者: '田中太郎',
      対応状況: '進行中',
      作成日時: '2026-01-10T09:00:00Z',
      更新日時: '2026-01-15T10:00:00Z',
      作成者: 'user-123',
      updatedAt: '2026-01-15T10:00:00Z',
    };

    const updatedRecord: MigrationRiskAssessmentRecord = {
      riskAssessmentId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: 'proj-001',
      riskClassification: '技術的リスク',
      riskItemName: 'データ移行ボリュームリスク',
      riskDescription: '既存システムとの技術スタック非互換性による統合困難',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 72,
      remediationApproach: '軽減',
      remediationStrategy: '既存システム連携用APIレイヤーの構築',
      responsiblePerson: '田中太郎',
      remediationStatus: '進行中',
      remarks: undefined,
      assessorId: 'user-123',
      assessmentTimestamp: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-10T09:00:00Z',
      createdBy: 'user-123',
      updatedAt: '2026-01-20T14:30:00Z',
      updatedBy: 'user-456',
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockResolvedValue(updatedRecord);

    const result = await updateMigrationRiskAssessment({
      riskAssessmentId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: 'proj-001',
      riskClassification: '技術的リスク',
      riskItemName: 'データ移行ボリュームリスク',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 72,
      remediationApproach: '軽減',
      userId: 'user-456',
      operationTimestamp: '2026-01-20T14:30:00Z',
    });

    expect(result.riskAssessmentId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.projectId).toBe('proj-001');
    expect(result.riskClassification).toBe('技術的リスク');
    expect(result.riskItemName).toBe('データ移行ボリュームリスク');
    expect(result.riskDescription).toBe('既存システムとの技術スタック非互換性による統合困難');
    expect(result.occurrencePossibilityLevel).toBe('中');
    expect(result.impactLevel).toBe('高');
    expect(result.riskEvaluationScore).toBe(72);
    expect(result.remediationApproach).toBe('軽減');
    expect(result.remediationStrategy).toBe('既存システム連携用APIレイヤーの構築');
    expect(result.responsiblePerson).toBe('田中太郎');
    expect(result.remediationStatus).toBe('進行中');
    expect(result.remarks).toBeUndefined();
    expect(result.assessorId).toBe('user-123');
    expect(result.assessmentTimestamp).toBe('2026-01-15T10:00:00Z');
    expect(result.createdAt).toBe('2026-01-10T09:00:00Z');
    expect(result.createdBy).toBe('user-123');
    expect(result.updatedAt).toBe('2026-01-20T14:30:00Z');
    expect(result.updatedBy).toBe('user-456');
  });
});
