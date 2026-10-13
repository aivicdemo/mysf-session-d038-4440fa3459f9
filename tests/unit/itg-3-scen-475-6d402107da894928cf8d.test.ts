import {
  validateUserAuthorizationForToleranceJudgment,
  InvalidUserIdError,
  ValidateUserAuthorizationForToleranceJudgmentInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-475: 修正対象の差異IDが妥当でない場合', () => {
  it('修正内容の再検証を実行できない', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: '',
      userRole: 'data_analyst',
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
