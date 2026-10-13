import { deleteMappingDetails, UserAuthorizationFailedError } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as authAuth from '../../src/logic/authentication-authorization';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/platform/data-store');

describe('SCEN-221: deleteMappingDetails - UserAuthorizationFailedError', () => {
  const mappingDetailId = '550e8400-e29b-41d4-a716-446655440000';
  const projectId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const operationTimestamp = '2026-01-15T10:30:00Z';

  const targetRecord = {
    '機能マッピング詳細ID': mappingDetailId,
    '移行プロジェクトID': projectId,
    '既存機能名': '請求書管理',
    '既存機能説明': '既存システムの請求書機能',
    'マッピング対象オブジェクトID': '880e8400-e29b-41d4-a716-446655440003',
    'マッピング方式': '標準オブジェクト変換',
    '実装方針': 'カスタムフィールド追加',
    '移行ステータス': '未実装',
    '優先度': 1,
    '複雑度': '高',
    '依存関係': '請求明細マッピングに依存',
    '検証方法': '単体テスト',
    '検証ステータス': '未検証',
    '備考': 'テスト用レコード'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserAuthorizationFailedError when user lacks delete permission', async () => {
    (authAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: false,
      userId
    });

    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      isContextValid: true
    });

    (dataStore.listRecords as jest.Mock).mockResolvedValue([targetRecord]);

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow(UserAuthorizationFailedError);

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow('機能マッピング詳細の削除権限がありません。');

    expect(dataStore.deleteRecord).not.toHaveBeenCalled();
  });
});
