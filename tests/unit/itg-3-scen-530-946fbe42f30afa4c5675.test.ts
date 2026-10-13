import { describe, it, expect } from '@jest/globals';
import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';
import type {
  ValidateUserAuthorizationForCSVExportInput,
  ValidateUserAuthorizationForCSVExportOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-530: 権限のあるユーザーが正常な期間・商談ステータスで新システム請求書データを抽出すると、旧システムと比較可能な形式で整理され、以降の工程に引き継がれる', () => {
  it('should authorize user with correct role for CSV export', async () => {
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: 'user-001',
      userRole: '営業部システム担当',
      userIsActive: true,
    };

    const result: ValidateUserAuthorizationForCSVExportOutput = await validateUserAuthorizationForCSVExport(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.authorizedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
