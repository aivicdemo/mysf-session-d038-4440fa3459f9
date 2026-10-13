import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-521: 同じリクエストを複数回実行した場合、べき等性が保証され重複実行の影響が回避される', () => {
  it('should return identical results on repeated calls with same input', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result1 = await validateUserAuthorizationForToleranceJudgment(input);
    const result2 = await validateUserAuthorizationForToleranceJudgment(input);
    const result3 = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result1.isAuthorized).toBe(true);
    expect(result2.isAuthorized).toBe(true);
    expect(result3.isAuthorized).toBe(true);

    expect(result1.userId).toBe('user-001');
    expect(result2.userId).toBe('user-001');
    expect(result3.userId).toBe('user-001');

    expect(result1.authorizedAt).toBe(result2.authorizedAt);
    expect(result2.authorizedAt).toBe(result3.authorizedAt);
  });
});
