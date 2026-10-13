import {
  validateUserAuthorizationForToleranceJudgment,
  UnauthorizedRoleError,
  ValidateUserAuthorizationForToleranceJudgmentInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-474: 修正対象ユーザーが営業部システム担当未満の権限しかない場合', () => {
  it('修正内容の再検証を実行できない', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'sales_representative',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      UnauthorizedRoleError,
    );
    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      'このユーザーのロールは差異の許容範囲判定を実行する権限がありません。',
    );
  });
});
