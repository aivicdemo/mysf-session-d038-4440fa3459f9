import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';

describe('SCEN-537: validateUserAuthorizationForCSVExport', () => {
  it('should return isAuthorized=true with userId="USER-001" and ISO 8601 authorizedAt', async () => {
    const result = await validateUserAuthorizationForCSVExport({
      userId: 'USER-001',
      userRole: '営業部システム担当',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('USER-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
