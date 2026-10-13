import {
  validateUserAuthorizationForToleranceJudgment,
  type ValidateUserAuthorizationForToleranceJudgmentInput,
  type ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-704: validateUserAuthorizationForToleranceJudgment with DATA_RECONCILIATION_OFFICER role', () => {
  it('should return authorized output with isAuthorized=true for DATA_RECONCILIATION_OFFICER role', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'DATA_RECONCILIATION_OFFICER',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
