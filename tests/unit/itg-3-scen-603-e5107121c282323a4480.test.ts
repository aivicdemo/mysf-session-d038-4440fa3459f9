import {
  validateUserAuthorizationForToleranceJudgment,
  ValidateUserAuthorizationForToleranceJudgmentInput,
  ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-603: validateUserAuthorizationForToleranceJudgment - Input validation with DATA_RECONCILIATION_ADMIN role', () => {
  it('should pass authorization and input validation when user is DATA_RECONCILIATION_ADMIN and input is valid', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'DATA_RECONCILIATION_ADMIN',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
