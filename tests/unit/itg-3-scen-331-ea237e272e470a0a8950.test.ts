import { validateUserAuthorizationForCSVExport, InvalidUserIdError } from '../../src/logic/authorization-validation';

describe('SCEN-331: validateUserAuthorizationForCSVExport - InvalidUserIdError when userId is empty or null', () => {
  it('should throw InvalidUserIdError when userId is empty string', async () => {
    await expect(
      validateUserAuthorizationForCSVExport({
        userId: '',
        userRole: '営業部システム担当',
        userIsActive: true,
      })
    ).rejects.toThrow(InvalidUserIdError);

    try {
      await validateUserAuthorizationForCSVExport({
        userId: '',
        userRole: '営業部システム担当',
        userIsActive: true,
      });
      fail('Should have thrown InvalidUserIdError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidUserIdError);
      expect((error as Error).message).toBe('ユーザーIDが無効です。');
    }
  });

  it('should throw InvalidUserIdError when userId is null', async () => {
    await expect(
      validateUserAuthorizationForCSVExport({
        userId: null as any,
        userRole: '営業部システム担当',
        userIsActive: true,
      })
    ).rejects.toThrow(InvalidUserIdError);

    try {
      await validateUserAuthorizationForCSVExport({
        userId: null as any,
        userRole: '営業部システム担当',
        userIsActive: true,
      });
      fail('Should have thrown InvalidUserIdError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidUserIdError);
      expect((error as Error).message).toBe('ユーザーIDが無効です。');
    }
  });
});
