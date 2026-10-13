import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-613: 判定対象の差異種類が空または未定義のとき、『差異の種類が指定されていません』例外が発生する', () => {
  it('userId が空文字列のとき、InvalidUserIdError 例外が発生する', async () => {
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
