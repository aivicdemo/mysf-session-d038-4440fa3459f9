import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-696: validateUserAuthorizationForToleranceJudgment で userId が空文字のとき InvalidUserIdError が発生', () => {
  it('should throw InvalidUserIdError with message when userId is empty string', async () => {
    const input = {
      userId: '',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      new InvalidUserIdError('有効なユーザーIDが指定されていません。')
    );
  });
});
