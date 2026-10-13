import { retrieveMappingDetailsForProject, DataStoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-206: retrieveMappingDetailsForProject - DataStoreError発生時', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('機能マッピング詳細テーブルからのデータ取得に失敗した場合、DataStoreErrorが発生する', async () => {
    // 前提条件: resolveProjectContext がプロジェクトが存在するため成功
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
    });

    // 前提条件: 永続化層の listRecords を呼び出して、指定されたプロジェクトIDに属する
    // 機能マッピング詳細レコードを取得する際、DataStoreError をスロー
    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new DataStoreError('機能マッピング詳細レコードの取得に失敗しました。')
    );

    // テスト対象の処理を呼び出す
    await expect(
      retrieveMappingDetailsForProject({ projectId })
    ).rejects.toThrow(DataStoreError);

    // 期待結果: DataStoreError が発生し、
    // エラー文言『機能マッピング詳細レコードの取得に失敗しました。』を含むエラーメッセージが返される
    try {
      await retrieveMappingDetailsForProject({ projectId });
    } catch (error) {
      if (error instanceof DataStoreError) {
        expect(error.message).toContain('機能マッピング詳細レコードの取得に失敗しました。');
      }
    }
  });
});
