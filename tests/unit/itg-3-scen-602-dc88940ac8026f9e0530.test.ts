import {
  validateUserAuthorizationForToleranceJudgment,
  ValidateUserAuthorizationForToleranceJudgmentInput,
  ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-602: validateUserAuthorizationForToleranceJudgment - User with TOLERANCE_JUDGE role', () => {
  it('should pass authorization when user has TOLERANCE_JUDGE role and is active', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-12345',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
