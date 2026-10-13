import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-694: 権限のないユーザーが是正方法判定を実行しようとするとき、権限検証に失敗して処理が中断される', () => {
  it('userId が空文字列のとき、InvalidUserIdError がスローされる', async () => {
    const input = {
      userId: '',
      userRole: 'viewer',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(InvalidUserIdError);
  });

  it('InvalidUserIdError のエラー文言は「有効なユーザーIDが指定されていません。」である', async () => {
    const input = {
      userId: '',
      userRole: 'viewer',
      userIsActive: true,
    };

    try {
      await validateUserAuthorizationForToleranceJudgment(input);
      fail('InvalidUserIdError should have been thrown');
    } catch (error) {
      if (error instanceof InvalidUserIdError) {
        expect(error.message).toBe('有効なユーザーIDが指定されていません。');
      } else {
        throw error;
      }
    }
  });
});
