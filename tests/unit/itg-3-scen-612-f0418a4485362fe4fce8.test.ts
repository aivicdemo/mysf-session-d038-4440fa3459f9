import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-612: 差異IDが指定されていないとき、入力検証で拒否される', () => {
  it('userId が空文字列のとき、InvalidUserIdError が発生する', async () => {
    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: '',
        userRole: 'TOLERANCE_JUDGE',
        userIsActive: true,
      })
    ).rejects.toThrow(InvalidUserIdError);
  });

  it('エラー文言が「有効なユーザーIDが指定されていません。」である', async () => {
    await expect(
      validateUserAuthorizationForToleranceJudgment({
        userId: '',
        userRole: 'TOLERANCE_JUDGE',
        userIsActive: true,
      })
    ).rejects.toThrow('有効なユーザーIDが指定されていません。');
  });
});
