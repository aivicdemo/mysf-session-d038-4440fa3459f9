import { saveMigrationRiskAssessment, DataStoreException } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-171: saveMigrationRiskAssessment - データストア保存失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataStoreExceptionが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-12345';
    const assessmentTimestamp = '2026-01-15T10:30:00Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
    });

    // Mock validateStandardFunctionMappings
    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
    });

    // Mock data store createRecord to throw DataStoreException
    (dataStore.createRecord as jest.Mock).mockRejectedValue(new DataStoreException());

    await expect(
      saveMigrationRiskAssessment({
        projectId,
        riskClassification: '機能ギャップ',
        riskItemName: '請求書承認フロー未実装',
        riskDescription: '移行対象システムの承認フロー機能がSalesforceで標準機能化されていない',
        occurrencePossibilityLevel: '高',
        impactLevel: '中',
        riskEvaluationScore: 75,
        remediationApproach: '軽減',
        remediationStrategy: 'Flow及びプロセスビルダーで代替実装を検討',
        responsiblePerson: '田中太郎',
        remediationStatus: '対応中',
        remarks: '承認ユーザー数が多いため複雑度が高い',
        assessorId: userId,
        assessmentTimestamp,
      })
    ).rejects.toThrow(DataStoreException);
  });
});
