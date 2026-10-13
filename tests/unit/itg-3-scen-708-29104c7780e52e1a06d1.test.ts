import {
  validateUserAuthorizationForDiscrepancyConfirmation,
  InvalidUserIdFormatError,
} from '../../src/logic/authorization-validation';

describe('SCEN-708: InvalidUserIdFormatError when user ID format is invalid', () => {
  it('should throw InvalidUserIdFormatError when userId is not UUID format', async () => {
    const input = {
      userId: 'invalid-user-id-not-uuid',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    await expect(
      validateUserAuthorizationForDiscrepancyConfirmation(input)
    ).rejects.toThrow(InvalidUserIdFormatError);

    try {
      await validateUserAuthorizationForDiscrepancyConfirmation(input);
    } catch (error) {
      if (error instanceof InvalidUserIdFormatError) {
        expect(error.message).toBe('ユーザーIDの形式が不正です。');
      } else {
        throw error;
      }
    }
  });
});
