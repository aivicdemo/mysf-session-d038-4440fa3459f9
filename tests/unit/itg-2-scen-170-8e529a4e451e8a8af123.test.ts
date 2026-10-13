import { saveMigrationRiskAssessment, InvalidRiskScoreException } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-170: saveMigrationRiskAssessment - 無効なリスクスコア', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvalidRiskScoreExceptionが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-12345';
    const assessmentTimestamp = '2026-10-07T10:30:00.000Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
    });

    // Mock validateStandardFunctionMappings to throw InvalidRiskScoreException
    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockRejectedValue(
      new InvalidRiskScoreException()
    );

    await expect(
      saveMigrationRiskAssessment({
        projectId,
        riskClassification: '機能ギャップ',
        riskItemName: '請求書承認フロー未対応',
        occurrencePossibilityLevel: '高',
        impactLevel: '中',
        riskEvaluationScore: -5,
        remediationApproach: '軽減',
        assessorId: userId,
        assessmentTimestamp,
      })
    ).rejects.toThrow(InvalidRiskScoreException);

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
