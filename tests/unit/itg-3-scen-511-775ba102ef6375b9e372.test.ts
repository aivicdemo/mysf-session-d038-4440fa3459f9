import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput, ValidateUserAuthorizationForToleranceJudgmentOutput } from '../../src/logic/authorization-validation';

describe('SCEN-511: validateUserAuthorizationForToleranceJudgment - User authorized', () => {
  it('should return isAuthorized=true with ISO 8601 authorizedAt when user role is escalation_manager and user is active', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'manager-001',
      userRole: 'escalation_manager',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForToleranceJudgmentOutput = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('manager-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
