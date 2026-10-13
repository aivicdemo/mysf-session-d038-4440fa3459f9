import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';

describe('SCEN-490: 通知送信が失敗した場合、画面に警告が表示され、管理者が手動で確認・対応するよう促される', () => {
  it('マネージャーユーザーが権限を持つ場合、isAuthorized=true で返される', async () => {
    const input = {
      userId: 'admin-001',
      userRole: 'manager',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForToleranceJudgment(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('admin-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
