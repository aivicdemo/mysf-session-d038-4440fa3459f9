import {
  validateUserAuthorizationForToleranceJudgment,
  ValidateUserAuthorizationForToleranceJudgmentInput,
  ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-605: validateUserAuthorizationForToleranceJudgment - Data retrieval with tolerance_judge role', () => {
  it('should verify validation data access when user role is tolerance_judge and is active', async () => {
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
