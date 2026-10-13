import {
  validateUserAuthorizationForToleranceJudgment,
  InvalidUserIdError,
  type ValidateUserAuthorizationForToleranceJudgmentInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-699: validateUserAuthorizationForToleranceJudgment with empty userId', () => {
  it('should throw InvalidUserIdError and not return output when userId is empty', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: '',
      userRole: 'admin',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(InvalidUserIdError);
    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      '有効なユーザーIDが指定されていません。'
    );
  });
});
