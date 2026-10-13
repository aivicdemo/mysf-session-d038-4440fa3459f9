import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-614: 指定された差異IDに対応する差異検出結果が存在しないとき、取得処理で失敗する', () => {
  it('userId が空文字列のとき、InvalidUserIdError エラーが発生する', async () => {
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
