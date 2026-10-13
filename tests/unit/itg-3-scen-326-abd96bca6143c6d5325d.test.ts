import {
  validateUserAuthorizationForToleranceJudgment,
  InvalidUserIdError,
  type ValidateUserAuthorizationForToleranceJudgmentInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-326: ユーザーIDが空文字列またはnullの場合、InvalidUserIdErrorを発生させる', () => {
  it('should throw InvalidUserIdError when userId is empty string', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: '',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      InvalidUserIdError
    );

    try {
      await validateUserAuthorizationForToleranceJudgment(input);
      fail('Expected InvalidUserIdError to be thrown');
    } catch (error) {
      if (error instanceof InvalidUserIdError) {
        expect(error.message).toBe('有効なユーザーIDが指定されていません。');
      } else {
        throw error;
      }
    }
  });
});
