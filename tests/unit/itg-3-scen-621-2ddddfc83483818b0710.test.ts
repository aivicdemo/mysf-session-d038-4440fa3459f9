import {
  validateUserAuthorizationForToleranceJudgment,
  InvalidUserIdError,
} from '../../src/logic/authorization-validation';

describe('SCEN-621: ダッシュボード表示データの生成に失敗するとき、生成処理で失敗する', () => {
  test('should throw InvalidUserIdError when userId is empty string', async () => {
    const input = {
      userId: '',
      userRole: 'admin',
      userIsActive: true,
    };

    await expect(
      validateUserAuthorizationForToleranceJudgment(input)
    ).rejects.toThrow(InvalidUserIdError);

    try {
      await validateUserAuthorizationForToleranceJudgment(input);
    } catch (error) {
      expect((error as Error).message).toBe(
        '有効なユーザーIDが指定されていません。'
      );
    }
  });
});
