import { describe, it, expect } from '@jest/globals';
import { validateUserAuthorizationForCSVExport, InvalidUserIdError } from '../../src/logic/authorization-validation';
import type {
  ValidateUserAuthorizationForCSVExportInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-533: 新システムに存在しない商談ステータスで絞り込みが指定されると、入力パラメータ検証で処理が中断される', () => {
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
