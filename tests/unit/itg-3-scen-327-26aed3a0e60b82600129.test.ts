import {
  validateUserAuthorizationForToleranceJudgment,
  UnauthorizedRoleError,
  type ValidateUserAuthorizationForToleranceJudgmentInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-327: 権限なしロールを持つアクティブユーザーが権限検証を実行すると、UnauthorizedRoleErrorが発生する', () => {
  it('should throw UnauthorizedRoleError when user role has no permission for tolerance judgment', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-without-permission-001',
      userRole: 'viewer',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      UnauthorizedRoleError
    );

    try {
      await validateUserAuthorizationForToleranceJudgment(input);
      fail('Expected UnauthorizedRoleError to be thrown');
    } catch (error) {
      if (error instanceof UnauthorizedRoleError) {
        expect(error.message).toBe(
          'このユーザーのロールは差異の許容範囲判定を実行する権限がありません。'
        );
      } else {
        throw error;
      }
    }
  });
});
