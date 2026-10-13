import { validateUserAuthorizationForCSVExport } from '../../src/logic/authorization-validation';
import type {
  ValidateUserAuthorizationForCSVExportInput,
  ValidateUserAuthorizationForCSVExportOutput,
} from '../../src/logic/authorization-validation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-539: CSV出力操作の実行ユーザー・実行日時・出力対象件数・ファイル識別子が監査ログとして記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validateUserAuthorizationForCSVExport を呼び出す場合、戻り値の情報が監査ログとして記録される', async () => {
    // Arrange
    const input: ValidateUserAuthorizationForCSVExportInput = {
      userId: 'user-12345',
      userRole: 'sales-system-admin',
      userIsActive: true,
    };

    // Act
    const result = await validateUserAuthorizationForCSVExport(input);

    // Assert
    // 戻り値の isAuthorized フィールドが true
    expect(result.isAuthorized).toBe(true);

    // 戻り値の userId フィールドが 'user-12345'
    expect(result.userId).toBe('user-12345');

    // 戻り値の authorizedAt フィールドが ISO 8601 形式の日時文字列
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.authorizedAt).toMatch(isoDateRegex);

    // 監査ログが記録されたことを確認
    const mockCreateRecord = dataStore.createRecord as jest.Mock;
    expect(mockCreateRecord).toHaveBeenCalled();

    // 記録された監査ログエントリを取得して検証
    // 実行ユーザーID、ユーザーロール、権限検証結果、検証日時が記録されていることを確認
    const auditLogCalls = mockCreateRecord.mock.calls.filter(
      call => typeof call[0] === 'string' && call[0].includes('audit')
    );

    expect(auditLogCalls.length).toBeGreaterThan(0);

    const auditEntry = auditLogCalls[0][1];
    expect(auditEntry.userId).toBe('user-12345');
    expect(auditEntry.userRole).toBe('sales-system-admin');
    expect(auditEntry.authorizationResult).toBe('authorized');
    expect(auditEntry.authorizedAt).toBe(result.authorizedAt);
  });
});
