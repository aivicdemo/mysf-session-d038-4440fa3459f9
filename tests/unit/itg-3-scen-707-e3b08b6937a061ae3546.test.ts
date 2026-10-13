import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  UnauthorizedUserRoleError,
  type ValidateUserAuthorizationForDiscrepancyConfirmationInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-707: validateUserAuthorizationForDiscrepancyConfirmation with unauthorized role', () => {
  it('should throw UnauthorizedUserRoleError when user role does not have permission', async () => {
    const input: ValidateUserAuthorizationForDiscrepancyConfirmationInput = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userRole: '経理部',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForDiscrepancyConfirmation(input)).rejects.toThrow(UnauthorizedUserRoleError);
    await expect(validateUserAuthorizationForDiscrepancyConfirmation(input)).rejects.toThrow(
      'このユーザーのロールは差異確認操作を実行する権限がありません。'
    );
  });
});
