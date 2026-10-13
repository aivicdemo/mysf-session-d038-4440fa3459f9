import { saveMigrationRiskAssessment, ProjectContextNotResolvedException } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-165: saveMigrationRiskAssessment - プロジェクトコンテキスト解決失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ProjectContextNotResolvedExceptionが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const assessorId = 'user-12345';
    const assessmentTimestamp = '2026-01-15T10:30:00Z';

    // Mock resolveProjectContext to return null (project context cannot be resolved)
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(null);

    await expect(
      saveMigrationRiskAssessment({
        projectId,
        riskClassification: '機能ギャップ',
        riskItemName: '請求書承認フロー未実装',
        occurrencePossibilityLevel: '高',
        impactLevel: '高',
        riskEvaluationScore: 85,
        remediationApproach: '軽減',
        assessorId,
        assessmentTimestamp,
      })
    ).rejects.toThrow(ProjectContextNotResolvedException);

    // Verify that data store was not called
    expect(dataStore.createRecord).not.toHaveBeenCalled();
    expect(authenticationAuthorization.verifyUserAuthenticationAndAuthorization).not.toHaveBeenCalled();
    expect(dataValidationRules.validateStandardFunctionMappings).not.toHaveBeenCalled();
  });
});
