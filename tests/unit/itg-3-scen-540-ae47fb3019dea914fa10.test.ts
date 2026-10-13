import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';

describe('SCEN-540: validateUserAuthorizationForCSVExport - 権限検証成功時の処理', () => {
  test('ユーザーが有効状態で権限を持つ場合、isAuthorized=true で戻る', async () => {
    const result = await validateUserAuthorizationForCSVExport({
      userId: 'user-001',
      userRole: 'sales_system_admin',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
