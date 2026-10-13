import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-496: 是正後のデータが許容閾値以内だが、ステータス不整合がある場合、検証結果は要再確認となる', () => {
  it('DATA_VALIDATOR ロールのユーザーが権限を持つ場合、isAuthorized=true で返される', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'DATA_VALIDATOR',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
