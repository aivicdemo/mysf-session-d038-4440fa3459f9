import {
  validateUserAuthorizationForToleranceJudgment,
  type ValidateUserAuthorizationForToleranceJudgmentInput,
  type ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-705: validateUserAuthorizationForToleranceJudgment with TOLERANCE_JUDGE role', () => {
  it('should return authorized output with isAuthorized=true, correct userId, and ISO 8601 datetime', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
