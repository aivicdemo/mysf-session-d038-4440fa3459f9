import {
  validateUserAuthorizationForCSVExport,
  InsufficientPermissionError,
  type ValidateUserAuthorizationForCSVExportInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-330: ユーザーがCSV出力操作の実行権限を持たない場合、InsufficientPermissionErrorが発生する', () => {
  it('should throw InsufficientPermissionError when user role lacks CSV export permission', async () => {
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: 'user-001',
      userRole: 'sales_staff',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForCSVExport(input)).rejects.toThrow(
      InsufficientPermissionError
    );

    try {
      await validateUserAuthorizationForCSVExport(input);
      fail('Expected InsufficientPermissionError to be thrown');
    } catch (error) {
      if (error instanceof InsufficientPermissionError) {
        expect(error.message).toBe(
          'ユーザーのロールがCSV出力操作の実行権限を持たないため、操作を実行できません。'
        );
      } else {
        throw error;
      }
    }
  });
});
