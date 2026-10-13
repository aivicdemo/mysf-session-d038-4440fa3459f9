import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-506: AIエージェント：修正対象の営業担当者に自動通知が送信され、修正期限が設定される', () => {
  it('userId=sales_user_001, userRole=SALES_MANAGER, userIsActive=trueで呼び出すと、isAuthorized=true、ISO 8601形式の日時が返される', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'sales_user_001',
      userRole: 'SALES_MANAGER',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('sales_user_001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/);
  });
});
