import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';

describe('SCEN-334: validateUserAuthorizationForCSVExport - isAuthorized is true', () => {
  it('should return isAuthorized=true for valid user', async () => {
    const result = await validateUserAuthorizationForCSVExport({
      userId: 'user-001',
      userRole: 'sales_system_manager',
      userIsActive: true,
    });

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
