import {
  validateUserAuthorizationForCSVExport,
  UserNotActiveError,
  type ValidateUserAuthorizationForCSVExportInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-329: ユーザーが無効状態の場合、UserNotActiveErrorが発生する', () => {
  it('should throw UserNotActiveError when user is not active', async () => {
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: 'user-12345',
      userRole: 'sales-manager',
      userIsActive: false,
    };

    await expect(validateUserAuthorizationForCSVExport(input)).rejects.toThrow(
      UserNotActiveError
    );

    try {
      await validateUserAuthorizationForCSVExport(input);
      fail('Expected UserNotActiveError to be thrown');
    } catch (error) {
      if (error instanceof UserNotActiveError) {
        expect(error.message).toBe(
          'ユーザーが無効状態のため、CSV出力操作を実行できません。'
        );
      } else {
        throw error;
      }
    }
  });
});
