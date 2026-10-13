import { validateUserAuthorizationForToleranceJudgment, UnauthorizedRoleError } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-520: ユーザーが権限を持たない場合、リクエストは拒否される', () => {
  it('should reject user with viewer role lacking tolerance judgment permission', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-without-permission',
      userRole: 'viewer',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(UnauthorizedRoleError);
  });
});
