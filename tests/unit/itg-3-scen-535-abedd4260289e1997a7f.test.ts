import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';

describe('SCEN-535: validateUserAuthorizationForCSVExport', () => {
  it('should return isAuthorized=true with userId and ISO 8601 authorizedAt when user is authorized', async () => {
    const result = await validateUserAuthorizationForCSVExport({
      userId: 'user-12345',
      userRole: 'sales_admin',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
