import { deleteMappingDetails } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as authAuth from '../../src/logic/authentication-authorization';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/platform/data-store');

describe('SCEN-216: deleteMappingDetails - normal case', () => {
  const mappingDetailId = '550e8400-e29b-41d4-a716-446655440000';
  const projectId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const operationTimestamp = '2026-10-07T10:30:00.000Z';

  const targetRecord = {
    id: mappingDetailId,
    '機能マッピング詳細ID': mappingDetailId,
    '移行プロジェクトID': projectId,
    '既存機能名': '請求書ヘッダ作成',
    '既存機能説明': '請求書ヘッダ情報の作成・保存機能',
    'マッピング対象オブジェクトID': '880e8400-e29b-41d4-a716-446655440003',
    'マッピング方式': '直接変換',
    '実装方針': 'Invoice__cカスタムオブジェクトに1:1対応',
    '移行ステータス': 'マッピング完了',
    '優先度': 1,
    '複雑度': '低',
    '依存関係': 'なし',
    '検証方法': 'ユニットテスト',
    '検証ステータス': '合格',
    '備考': '標準機能のみ使用'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete mapping detail record successfully', async () => {
    (authAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId
    });

    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      isContextValid: true
    });

    (dataStore.listRecords as jest.Mock).mockResolvedValue([targetRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);

    await deleteMappingDetails({
      mappingDetailId,
      projectId,
      userId,
      operationTimestamp
    });

    expect(dataStore.deleteRecord).toHaveBeenCalledWith('機能マッピング詳細', mappingDetailId);
  });
});
