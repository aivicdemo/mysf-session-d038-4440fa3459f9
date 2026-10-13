import { validateUserAuthorizationForToleranceJudgment, UnauthorizedRoleError } from '../../src/logic/authorization-validation';

describe('SCEN-611: 呼び出し元ユーザーが許容範囲判定の実行権限を持たないとき、権限検証で拒否される', () => {
  it('ロール viewer に対して権限が無いと判定されるとき、UnauthorizedRoleError が発生する', async () => {
    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: 'user-001',
        userRole: 'viewer',
        userIsActive: true,
      })
    ).rejects.toThrow(UnauthorizedRoleError);
  });

  it('エラー文言が「このユーザーのロールは差異の許容範囲判定を実行する権限がありません。」である', async () => {
    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: 'user-001',
        userRole: 'viewer',
        userIsActive: true,
      })
    ).rejects.toThrow('このユーザーのロールは差異の許容範囲判定を実行する権限がありません。');
  });
});
