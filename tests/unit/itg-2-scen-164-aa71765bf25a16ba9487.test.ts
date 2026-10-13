import { saveMigrationRiskAssessment } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-164: saveMigrationRiskAssessment - 正常系（全必須項目・権限・コンテキスト有効）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リスク評価レコードが保存され、UUIDと作成情報を含むレコードが返される', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const assessorId = 'user-001-uuid';
    const assessmentTimestamp = '2026-01-15T10:30:00Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: assessorId,
    });

    // Mock validateStandardFunctionMappings
    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    // Mock data store - createRecord should store and return the record
    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      riskAssessmentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      projectId,
      riskClassification: '機能ギャップ',
      riskItemName: '請信明細の自動計算機能',
      riskDescription: '移行対象システムの請求明細行の税抜き金額・税額・税込み金額の自動計算ロジックがSalesforceの計算項目では実装困難',
      occurrencePossibilityLevel: '高',
      impactLevel: '高',
      riskEvaluationScore: 85,
      remediationApproach: '軽減',
      remediationStrategy: 'カスタム計算ロジックをApexトリガーで実装し、ワークフロー時に自動実行',
      responsiblePerson: '山田太郎',
      remediationStatus: '対応中',
      remarks: 'Apexによる実装は Q2 中に完了予定。テストは Q3 初旬に実施',
      assessorId,
      assessmentTimestamp,
      createdAt: '2026-01-15T10:30:00Z',
      createdBy: assessorId,
      updatedAt: '2026-01-15T10:30:00Z',
      updatedBy: assessorId,
    });

    const result = await saveMigrationRiskAssessment({
      projectId,
      riskClassification: '機能ギャップ',
      riskItemName: '請信明細の自動計算機能',
      riskDescription: '移行対象システムの請求明細行の税抜き金額・税額・税込み金額の自動計算ロジックがSalesforceの計算項目では実装困難',
      occurrencePossibilityLevel: '高',
      impactLevel: '高',
      riskEvaluationScore: 85,
      remediationApproach: '軽減',
      remediationStrategy: 'カスタム計算ロジックをApexトリガーで実装し、ワークフロー時に自動実行',
      responsiblePerson: '山田太郎',
      remediationStatus: '対応中',
      remarks: 'Apexによる実装は Q2 中に完了予定。テストは Q3 初旬に実施',
      assessorId,
      assessmentTimestamp,
    });

    expect(result.riskAssessmentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.projectId).toBe(projectId);
    expect(result.riskClassification).toBe('機能ギャップ');
    expect(result.riskItemName).toBe('請信明細の自動計算機能');
    expect(result.occurrencePossibilityLevel).toBe('高');
    expect(result.impactLevel).toBe('高');
    expect(result.riskEvaluationScore).toBe(85);
    expect(result.remediationApproach).toBe('軽減');
    expect(result.assessorId).toBe(assessorId);
    expect(result.createdAt).toBe(result.updatedAt);
    expect(result.createdBy).toBe(assessorId);
    expect(result.updatedBy).toBe(assessorId);
    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
