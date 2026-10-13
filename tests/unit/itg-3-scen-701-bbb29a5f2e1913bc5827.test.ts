import {
  validateUserAuthorizationForToleranceJudgment,
  type ValidateUserAuthorizationForToleranceJudgmentInput,
  type ValidateUserAuthorizationForToleranceJudgmentOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-701: validateUserAuthorizationForToleranceJudgment with tolerance_judge role', () => {
  it('should return authorized output when validateUserRolePermission returns true', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
