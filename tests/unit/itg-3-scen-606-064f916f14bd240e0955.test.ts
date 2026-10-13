import {
  validateUserAuthorizationForToleranceJudgment,
  ValidateUserAuthorizationForToleranceJudgmentInput,
  ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-606: validateUserAuthorizationForToleranceJudgment - Tolerance criteria retrieval with TOLERANCE_VALIDATOR role', () => {
  it('should retrieve tolerance criteria when user has TOLERANCE_VALIDATOR role', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-12345',
      userRole: 'TOLERANCE_VALIDATOR',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
