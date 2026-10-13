import {
  validateUserAuthorizationForToleranceJudgment,
  InvalidUserIdError,
  ValidateUserAuthorizationForToleranceJudgmentInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-476: 修正内容の入力値が妥当でない場合', () => {
  it('修正内容の再検証を実行できない', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: '',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      InvalidUserIdError,
    );
    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      '有効なユーザーIDが指定されていません。',
    );
  });
});
