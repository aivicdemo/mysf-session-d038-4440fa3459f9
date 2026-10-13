import { describe, it, expect } from '@jest/globals';
import { validateUserAuthorizationForCSVExport, InvalidUserIdError } from '../../src/logic/authorization-validation';
import type {
  ValidateUserAuthorizationForCSVExportInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-531: 請求書抽出権限のないユーザーが新システムデータ抽出を試みると、権限検証で処理が中断される', () => {
  it('should throw InvalidUserIdError when userId is empty string', async () => {
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: '',
      userRole: '営業担当',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForCSVExport(input)).rejects.toThrow(InvalidUserIdError);
    await expect(validateUserAuthorizationForCSVExport(input)).rejects.toThrow('ユーザーIDが無効です。');
  });
});
