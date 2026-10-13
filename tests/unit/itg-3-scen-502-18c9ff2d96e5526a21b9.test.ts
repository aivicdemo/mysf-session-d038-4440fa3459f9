import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-502: 検証結果が要再確認の場合、推奨アクションは経理部門に報告と判定される', () => {
  it('userId=user-accounting-001, userRole=accounting_manager, userIsActive=trueで呼び出すと、isAuthorized=true、ISO 8601形式の日時が返される', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-accounting-001',
      userRole: 'accounting_manager',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-accounting-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/);
  });
});
