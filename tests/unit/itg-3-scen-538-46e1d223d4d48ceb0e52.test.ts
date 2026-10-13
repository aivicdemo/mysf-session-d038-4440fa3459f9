import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';
import type {
  ValidateUserAuthorizationForCSVExportInput,
  ValidateUserAuthorizationForCSVExportOutput,
} from '../../src/logic/authorization-validation';

describe('SCEN-538: 整形されたデータがCSVファイルとして生成され、ファイルストレージに保存される', () => {
  it('validateUserAuthorizationForCSVExport が userId=user-001、userRole=sales_system_manager、userIsActive=true で呼ばれた場合、isAuthorized=true、userId=user-001、authorizedAt が ISO 8601 形式の日時文字列で返される', async () => {
    // Arrange
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: 'user-001',
      userRole: 'sales_system_manager',
      userIsActive: true,
    };

    // Act
    const result = await validateUserAuthorizationForCSVExport(input);

    // Assert
    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');

    // ISO 8601 形式の日時文字列であることを確認（例：2026-10-13T12:34:56.789Z）
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.authorizedAt).toMatch(isoDateRegex);
  });
});
