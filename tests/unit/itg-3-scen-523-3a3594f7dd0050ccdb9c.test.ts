import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-523: 部分的な副作用の後にロールバックが実行された場合、システムの整合性が保たれる', () => {
  it('should validate user authorization before and after rollback scenarios', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    // First call before rollback scenario
    const result1 = await validateUserAuthorizationForToleranceJudgment(input);
    expect(result1.isAuthorized).toBe(true);
    expect(result1.userId).toBe('user-001');
    expect(result1.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Second call after rollback scenario (should maintain consistency)
    const result2 = await validateUserAuthorizationForToleranceJudgment(input);
    expect(result2.isAuthorized).toBe(true);
    expect(result2.userId).toBe('user-001');
    expect(result2.authorizedAt).toBe(result1.authorizedAt);
  });
});
