import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-497: 是正後のデータが許容閾値を超える場合、検証結果は不合格となる', () => {
  it('data_analyst ロールのユーザーが権限を持つ場合、isAuthorized=true で返される', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'data_analyst',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
