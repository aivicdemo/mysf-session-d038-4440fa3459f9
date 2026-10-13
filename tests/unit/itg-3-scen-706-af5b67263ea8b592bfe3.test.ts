import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  type ValidateUserAuthorizationForDiscrepancyConfirmationInput,
  type ValidateUserAuthorizationForDiscrepancyConfirmationOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-706: validateUserAuthorizationForDiscrepancyConfirmation with valid authorization', () => {
  it('should return isAuthorized=true with correct userId and ISO 8601 datetime', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForDiscrepancyConfirmationOutput = await validateUserAuthorizationForDiscrepancyConfirmation(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
