import { validateUserAuthorizationForToleranceJudgment, UnauthorizedRoleError } from '../../src/logic/authorization-validation';

describe('SCEN-483: ステータス遷移が営業プロセスルールに違反する場合、修正内容は却下される', () => {
  it('sales_manager ロールでは UnauthorizedRoleError がスローされる', async () => {
    const input = {
      userId: 'user-456',
      userRole: 'sales_manager',
      userIsActive: true
    };

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(UnauthorizedRoleError);
    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow(
      'このユーザーのロールは差異の許容範囲判定を実行する権限がありません。'
    );
  });
});
