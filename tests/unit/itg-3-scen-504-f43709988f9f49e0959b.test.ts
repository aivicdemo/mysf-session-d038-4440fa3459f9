import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import type { ValidateUserAuthorizationForToleranceJudgmentInput } from '../../src/logic/authorization-validation';

describe('SCEN-504: AIエージェント：取引先・商談・請求データの整合性を自動検証する', () => {
  it('userId=user-001, userRole=tolerance_judge, userIsActive=trueで呼び出すと、isAuthorized=true、ISO 8601形式の日時が返される', async () => {
    const input: ValidateUserAuthorizationForToleranceJudgmentInput = {
      userId: 'user-001',
      userRole: 'tolerance_judge',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/);
  });
});
