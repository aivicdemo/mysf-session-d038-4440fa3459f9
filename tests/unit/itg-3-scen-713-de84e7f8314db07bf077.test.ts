import {
  validateUserAuthorizationForDiscrepancyConfirmation,
} from '../../src/logic/authorization-validation';

describe('SCEN-713: Authorization for Sales System Staff role', () => {
  it('should return authorized output when user has Sales System Staff role', async () => {
    const input = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    const result =
      await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');

    const authorizedAt = new Date(result.authorizedAt);
    expect(authorizedAt).toBeInstanceOf(Date);
    expect(!isNaN(authorizedAt.getTime())).toBe(true);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(iso8601Regex.test(result.authorizedAt)).toBe(true);
  });
});
