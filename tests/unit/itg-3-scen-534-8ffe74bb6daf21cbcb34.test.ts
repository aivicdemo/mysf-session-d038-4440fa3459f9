import { describe, it, expect } from '@jest/globals';
import { validateUserAuthorizationForCSVExport, InvalidUserIdError } from '../../src/logic/authorization-validation';
import type {
  ValidateUserAuthorizationForCSVExportInput,
} from '../../src/logic/authorization-validation';

describe('SCEN-534: 新システムへの接続情報が不正または接続に失敗すると、データ抽出工程で処理が中断される', () => {
  it('should throw InvalidUserIdError when userId is empty string', async () => {
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: '',
      userRole: '営業部',
      userIsActive: true,
    };

    await expect(validateUserAuthorizationForCSVExport(input)).rejects.toThrow(InvalidUserIdError);
    await expect(validateUserAuthorizationForCSVExport(input)).rejects.toThrow('ユーザーIDが無効です。');
  });
});
