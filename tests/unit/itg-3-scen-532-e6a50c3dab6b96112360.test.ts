import { validateUserAuthorizationForCSVExport, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-532: InvalidUserIdError when userId is empty string', () => {
  it('should throw InvalidUserIdError when userId is empty string', async () => {
    const userId = '';
    const userRole = 'sales_manager';
    const userIsActive = true;

    await expect(
      validateUserAuthorizationForCSVExport({
        userId,
        userRole,
        userIsActive,
      })
    ).rejects.toThrow(InvalidUserIdError);

    try {
      await validateUserAuthorizationForCSVExport({
        userId,
        userRole,
        userIsActive,
      });
      fail('Should have thrown InvalidUserIdError');
    } catch (error) {
      if (error instanceof InvalidUserIdError) {
        expect(error.message).toBe('ユーザーIDが無効です。');
      } else {
        throw error;
      }
    }
  });
});
