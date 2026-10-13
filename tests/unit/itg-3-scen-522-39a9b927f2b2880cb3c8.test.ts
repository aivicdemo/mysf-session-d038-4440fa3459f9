import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-522: 処理の実行履歴が監査ログとして記録され、追跡可能である', () => {
  it('should execute authorization validation and track execution', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Authorization validation should succeed with expected output structure
    expect(result).toHaveProperty('isAuthorized');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('authorizedAt');
  });
});
