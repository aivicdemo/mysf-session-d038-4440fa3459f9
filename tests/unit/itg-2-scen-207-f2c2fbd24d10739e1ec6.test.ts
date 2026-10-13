import { retrieveMappingDetailsForProject, MappingDetailRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-207: retrieveMappingDetailsForProject - 空の配列返却', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定したプロジェクトIDに属する機能マッピング詳細レコードが0件の場合、空の配列が返される', async () => {
    // 前提条件: projectId
    // 前提条件: 機能マッピング詳細テーブルの全レコード = []
    // 前提条件: resolveProjectContext の戻り値 = {"projectId":"550e8400-e29b-41d4-a716-446655440000"}

    // resolveProjectContext がプロジェクトコンテキストを正常に返す
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // 機能マッピング詳細テーブルへのデータ取得クエリが実行され、
    // 指定プロジェクトIDに属するレコードがゼロ件である状態から結果を受け取る
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    // テスト対象の処理を呼び出す
    const result = await retrieveMappingDetailsForProject({ projectId });

    // 期待結果: 戻り値の型 MappingDetailRecord[] が空の配列 [] で返される
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
