import {
  validateUserAuthorizationForToleranceJudgment,
  UnauthorizedRoleError,
} from '../../src/logic/authorization-validation';

describe('SCEN-624: 許容基準値を小数点第1位で超過するとき、判定結果『要対応』が生成される', () => {
  test('should throw UnauthorizedRoleError when user has DATA_ANALYST role which does not have tolerance judgment permission', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'DATA_ANALYST',
      userIsActive: true,
    };

    await expect(
      validateUserAuthorizationForToleranceJudgment(input)
    ).rejects.toThrow(UnauthorizedRoleError);

    try {
      await validateUserAuthorizationForToleranceJudgment(input);
    } catch (error) {
      expect((error as Error).message).toBe(
        'このユーザーのロールは差異の許容範囲判定を実行する権限がありません。'
      );
    }
  });
});
