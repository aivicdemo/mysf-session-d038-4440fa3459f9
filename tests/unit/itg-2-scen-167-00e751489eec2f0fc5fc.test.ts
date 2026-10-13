import { saveMigrationRiskAssessment, UserAuthorizationFailedException } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-167: saveMigrationRiskAssessment - ユーザー権限失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UserAuthorizationFailedExceptionが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-001';
    const assessmentTimestamp = '2026-10-07T09:30:00Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization to return isAuthorized=false (no update permission)
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: false,
      authorizedToSaveRiskAssessment: false,
    });

    await expect(
      saveMigrationRiskAssessment({
        projectId,
        riskClassification: '機能ギャップ',
        riskItemName: '請求書承認フロー未対応',
        riskDescription: 'Salesforce標準承認プロセスの複雑な条件分岐がリプレース先で再現困難',
        occurrencePossibilityLevel: '高',
        impactLevel: '中',
        riskEvaluationScore: 75,
        remediationApproach: '軽減',
        remediationStrategy: 'カスタムワークフロー実装とユーザー教育',
        responsiblePerson: '田中太郎',
        remediationStatus: '対応中',
        remarks: '実装パートナーと協議中',
        assessorId: userId,
        assessmentTimestamp,
      })
    ).rejects.toThrow(UserAuthorizationFailedException);

    expect(dataStore.createRecord).not.toHaveBeenCalled();
    expect(dataValidationRules.validateStandardFunctionMappings).not.toHaveBeenCalled();
  });
});
