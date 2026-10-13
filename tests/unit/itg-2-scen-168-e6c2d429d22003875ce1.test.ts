import { saveMigrationRiskAssessment, InvalidRiskClassificationException } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-168: saveMigrationRiskAssessment - 無効なリスク分類', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvalidRiskClassificationExceptionが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-001';
    const assessmentTimestamp = '2026-01-15T10:30:00Z';

    // Mock resolveProjectContext
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // Mock verifyUserAuthenticationAndAuthorization
    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
    });

    // Mock validateStandardFunctionMappings to throw InvalidRiskClassificationException
    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockRejectedValue(
      new InvalidRiskClassificationException()
    );

    await expect(
      saveMigrationRiskAssessment({
        projectId,
        riskClassification: '無効な分類値',
        riskItemName: 'テストリスク項目',
        occurrencePossibilityLevel: '高',
        impactLevel: '高',
        riskEvaluationScore: 75,
        remediationApproach: '軽減',
        assessorId: userId,
        assessmentTimestamp,
      })
    ).rejects.toThrow(InvalidRiskClassificationException);

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
