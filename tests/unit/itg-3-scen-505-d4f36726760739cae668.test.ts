import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-505: AIエージェント：異常値・未完了案件を特定し、修正が必要な案件リストが作成される', () => {
  it('userId=user-001, userRole=data_reconciliation_manager, userIsActive=trueで呼び出すと、isAuthorized=true、ISO 8601形式の日時が返される', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'data_reconciliation_manager',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/);
  });
});
