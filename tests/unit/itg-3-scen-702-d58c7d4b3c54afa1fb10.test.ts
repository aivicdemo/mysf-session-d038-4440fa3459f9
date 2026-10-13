import {
  validateUserAuthorizationForToleranceJudgment,
  type ValidateUserAuthorizationForToleranceJudgmentInput,
  type ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-702: validateUserAuthorizationForToleranceJudgment with user-12345', () => {
  it('should return authorized output with isAuthorized=true for user-12345 with tolerance_judge role', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-12345',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
