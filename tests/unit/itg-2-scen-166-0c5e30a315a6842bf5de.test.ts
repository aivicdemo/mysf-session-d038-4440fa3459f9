import { saveMigrationRiskAssessment, UserAuthenticationFailedException } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-166: saveMigrationRiskAssessment - ユーザー認証失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UserAuthenticationFailedExceptionが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const assessorId = 'user-unauthenticated-001';
    const assessmentTimestamp = '2026-01-15T10:30:00Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization to return authenticated=false
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: false,
      authenticated: false,
    });

    await expect(
      saveMigrationRiskAssessment({
        projectId,
        riskClassification: '機能ギャップ',
        riskItemName: '請求書ステータス管理',
        occurrencePossibilityLevel: '高',
        impactLevel: '中',
        riskEvaluationScore: 75,
        remediationApproach: '軽減',
        assessorId,
        assessmentTimestamp,
      })
    ).rejects.toThrow(UserAuthenticationFailedException);

    expect(dataStore.createRecord).not.toHaveBeenCalled();
    expect(dataValidationRules.validateStandardFunctionMappings).not.toHaveBeenCalled();
  });
});
