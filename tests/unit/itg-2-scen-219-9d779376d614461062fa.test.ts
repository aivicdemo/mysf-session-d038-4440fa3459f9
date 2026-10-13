import { deleteMappingDetails, ProjectMismatchError } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as authAuth from '../../src/logic/authentication-authorization';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/platform/data-store');

describe('SCEN-219: deleteMappingDetails - ProjectMismatchError', () => {
  const mappingDetailId = '550e8400-e29b-41d4-a716-446655440001';
  const projectId = '550e8400-e29b-41d4-a716-446655440002';
  const userId = '550e8400-e29b-41d4-a716-446655440003';
  const operationTimestamp = '2026-10-07T06:31:45.000Z';

  const targetRecord = {
    id: mappingDetailId,
    '機能マッピング詳細ID': mappingDetailId,
    '移行プロジェクトID': '550e8400-e29b-41d4-a716-446655440099',
    '既存機能名': '請求書承認',
    '既存機能説明': '請求書の承認フロー',
    'マッピング対象オブジェクトID': '550e8400-e29b-41d4-a716-446655440004',
    'マッピング方式': 'カスタムオブジェクト',
    '実装方針': '承認プロセスで実装',
    '移行ステータス': '設計中',
    '優先度': 1,
    '複雑度': '中',
    '依存関係': 'なし',
    '検証方法': 'ユースケース検証',
    '検証ステータス': '未検証',
    '備考': 'テスト用レコード',
    '作成日時': '2026-10-01T00:00:00.000Z',
    '作成者': userId,
    '更新日時': '2026-10-06T00:00:00.000Z',
    '更新者': userId,
    'マッピング対象システムID': '550e8400-e29b-41d4-a716-446655440005',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-06T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectMismatchError when record belongs to different project', async () => {
    (authAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
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
    ).rejects.toThrow(ProjectMismatchError);

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow(`機能マッピング詳細レコード（ID: ${mappingDetailId}）は指定されたプロジェクト（ID: ${projectId}）に属していません。`);

    expect(dataStore.deleteRecord).not.toHaveBeenCalled();
  });
});
