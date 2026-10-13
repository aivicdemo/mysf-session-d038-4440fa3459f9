import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-623: 許容基準値と実差異値が完全に一致するとき、判定結果『軽微』が生成される', () => {
  test('should return isAuthorized=true and validateUserRolePermission should be called with TOLERANCE_JUDGE role', async () => {
    const input = {
      userId: 'user-12345',
      userRole: 'TOLERANCE_JUDGE',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
