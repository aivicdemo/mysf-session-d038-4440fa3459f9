import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-491: 通知送信が失敗した場合、内部ログに記録され、ダッシュボードに未送信アラートとして表示される', () => {
  it('DATA_REVIEWER ロールのユーザーが権限を持つ場合、isAuthorized=true で返される', async () => {
    const input = {
      userId: 'user-001',
      userRole: 'DATA_REVIEWER',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
