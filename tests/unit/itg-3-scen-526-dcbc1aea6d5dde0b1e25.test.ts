import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-526: AIエージェント統合テスト：Action 2 が正常に実行される（fake AI client使用）', () => {
  it('should execute Action 2 with successful user authorization for tolerance judgment', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
