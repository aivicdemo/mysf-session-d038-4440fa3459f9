import { validateUserAuthorizationForToleranceJudgment, UnauthorizedRoleError } from '../../src/logic/authorization-validation';

describe('SCEN-324: ユーザーロールが許容範囲判定実行権限を持たない場合', () => {
  it('UnauthorizedRoleError を発生させる', async () => {
    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: 'user-001',
        userRole: 'viewer',
        userIsActive: true,
      }),
    ).rejects.toThrow(UnauthorizedRoleError);

    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: 'user-001',
        userRole: 'viewer',
        userIsActive: true,
      }),
    ).rejects.toThrow('このユーザーのロールは差異の許容範囲判定を実行する権限がありません。');
  });
});
