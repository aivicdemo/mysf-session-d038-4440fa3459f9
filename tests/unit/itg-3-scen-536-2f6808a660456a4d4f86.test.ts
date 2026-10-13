import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';

describe('SCEN-536: validateUserAuthorizationForCSVExport', () => {
  it('should return isAuthorized=true with userId and ISO 8601 authorizedAt when user role is "営業部システム担当"', async () => {
    const result = await validateUserAuthorizationForCSVExport({
      userId: 'user-12345',
      userRole: '営業部システム担当',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
