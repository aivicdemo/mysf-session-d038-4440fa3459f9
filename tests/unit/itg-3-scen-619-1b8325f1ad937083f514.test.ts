import { validateUserAuthorizationForToleranceJudgment, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-619: validateUserAuthorizationForToleranceJudgment with empty userId', () => {
  it('should throw InvalidUserIdError when userId is empty string', async () => {
    const input = {
      userId: '',
      userRole: 'ADMIN',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(InvalidUserIdError);
    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow('有効なユーザーIDが指定されていません。');
  });
});
