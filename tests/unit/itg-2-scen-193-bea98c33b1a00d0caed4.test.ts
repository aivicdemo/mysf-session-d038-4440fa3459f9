import { updateMigrationRiskAssessment } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-193: updateMigrationRiskAssessment - Update all fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update all fields of risk assessment record', async () => {
    const riskAssessmentId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = 'user-admin-001';
    const operationTimestamp = '2026-02-10T14:30:00Z';

    const existingRecord = {
      riskAssessmentId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      riskClassification: '技術的リスク',
      riskItemName: 'データベース互換性',
      riskDescription: 'Oracle固有の機能がSalesforceで実装困難',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 65,
      remediationApproach: '軽減',
      remediationStrategy: 'ハイブリッド方式の導入検討',
      responsiblePerson: 'user-001',
      remediationStatus: '未対応',
      remarks: undefined,
      assessorId: 'user-001',
      assessmentTimestamp: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-15T10:00:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-01-15T10:00:00Z',
      updatedBy: 'user-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (dataStore.updateRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await updateMigrationRiskAssessment({
      riskAssessmentId,
      projectId,
      riskClassification: 'データリスク',
      riskItemName: '請求データ移行精度',
      riskDescription: '請求書・請求明細の取引金額・税計算がOracleとSalesforceで乖離するリスク',
      occurrencePossibilityLevel: '高',
      impactLevel: '高',
      riskEvaluationScore: 85,
      remediationApproach: '軽減',
      remediationStrategy: '移行前の包括的なテストケース設計、並行運用期間の設定、金額検証ツールの開発',
      responsiblePerson: 'pm-002',
      remediationStatus: '進行中',
      remarks: '請求機能は収益認識に直結するため最優先で対応が必要。SAP等他ERP連携の計算ロジック確認が急務',
      userId,
      operationTimestamp,
    });

    expect(result.riskAssessmentId).toBe(riskAssessmentId);
    expect(result.projectId).toBe(projectId);
    expect(result.riskClassification).toBe('データリスク');
    expect(result.riskItemName).toBe('請求データ移行精度');
    expect(result.riskDescription).toBe('請求書・請求明細の取引金額・税計算がOracleとSalesforceで乖離するリスク');
    expect(result.occurrencePossibilityLevel).toBe('高');
    expect(result.impactLevel).toBe('高');
    expect(result.riskEvaluationScore).toBe(85);
    expect(result.remediationApproach).toBe('軽減');
    expect(result.remediationStrategy).toBe('移行前の包括的なテストケース設計、並行運用期間の設定、金額検証ツールの開発');
    expect(result.responsiblePerson).toBe('pm-002');
    expect(result.remediationStatus).toBe('進行中');
    expect(result.remarks).toBe('請求機能は収益認識に直結するため最優先で対応が必要。SAP等他ERP連携の計算ロジック確認が急務');
    expect(result.assessorId).toBe('user-001');
    expect(result.assessmentTimestamp).toBe('2026-01-15T10:00:00Z');
    expect(result.createdAt).toBe('2026-01-15T10:00:00Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.updatedBy).toBe(userId);
  });
});
