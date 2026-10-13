import {
  validateUserAuthorizationForToleranceJudgment,
  ValidateUserAuthorizationForToleranceJudgmentInput,
  ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-607: validateUserAuthorizationForToleranceJudgment - Minor judgment with data_validator role', () => {
  it('should generate judgment result when user has data_validator role', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-12345',
      userRole: 'data_validator',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
