import {
  validateUserAuthorizationForCSVExport,
  type ValidateUserAuthorizationForCSVExportInput,
  type ValidateUserAuthorizationForCSVExportOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-328: 有効なユーザーが営業部システム担当以上の権限を持つ場合、CSV出力が許可される', () => {
  it('should return isAuthorized=true with valid user having required permission', async () => {
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: 'user-12345',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    const result = await validateUserAuthorizationForCSVExport(input);

    expect(result).toBeDefined();
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(typeof result.authorizedAt).toBe('string');
    // Check ISO 8601 format (basic validation)
    expect(result.authorizedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );
  });
});
