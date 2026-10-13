import { validateUserAuthorizationForToleranceJudgment, InactiveUserError } from '../../src/logic/authorization-validation';

describe('SCEN-325: ユーザーアカウントが無効（userIsActive=false）の場合', () => {
  it('InactiveUserError を発生させる', async () => {
    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: 'user-001',
        userRole: 'TOLERANCE_JUDGE',
        userIsActive: false,
      }),
    ).rejects.toThrow(InactiveUserError);

    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: 'user-001',
        userRole: 'TOLERANCE_JUDGE',
        userIsActive: false,
      }),
    ).rejects.toThrow('無効なユーザーアカウントでは操作を実行できません。');
  });
});
