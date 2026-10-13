import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';

describe('SCEN-541: validateUserAuthorizationForCSVExport - ISO 8601 形式で日時が返される', () => {
  test('ユーザーが有効状態で権限を持つ場合、authorizedAt がISO 8601 形式の日時文字列で返される', async () => {
    const result = await validateUserAuthorizationForCSVExport({
      userId: 'user-123',
      userRole: 'sales_system_admin',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-123');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
