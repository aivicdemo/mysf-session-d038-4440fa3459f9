import { retrieveMappingValidationResultsForProject, MappingValidationResultRecord } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-209: 指定されたプロジェクトIDに属するマッピング検証結果が1件も存在しないとき、空配列を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('空配列が返される', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';

    // resolveProjectContext をモック
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      projectName: 'Salesforce移行プロジェクト_A',
      status: 'active',
    });

    // データストアをモック：指定プロジェクトIDと異なるレコードのみ
    (dataStore.listRecords as jest.Mock).mockResolvedValue([
      {
        id: 'uuid-001',
        マッピング検証結果ID: 'uuid-001',
        移行プロジェクトID: '550e8400-e29b-41d4-a716-446655440001',
        機能マッピング詳細ID: 'uuid-m001',
        検証ステータス: '完了',
        検証日時: '2026-01-15T10:30:00Z',
        検証者ID: 'uuid-user-001',
        検出問題: 'フィールドマッピング不一致',
        推奨事項: 'スキーマ確認',
        リスクレベル: '中',
        対応状況: '対応予定',
        備考: '後日対応',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-15T10:30:00Z',
      },
      {
        id: 'uuid-002',
        マッピング検証結果ID: 'uuid-002',
        移行プロジェクトID: '550e8400-e29b-41d4-a716-446655440002',
        機能マッピング詳細ID: 'uuid-m002',
        検証ステータス: '完了',
        検証日時: '2026-01-16T14:20:00Z',
        検証者ID: 'uuid-user-002',
        検出問題: '計算ロジック差分',
        推奨事項: 'ロジック調整',
        リスクレベル: '高',
        対応状況: '対応中',
        備考: '優先度高',
        createdAt: '2026-01-16T14:00:00Z',
        updatedAt: '2026-01-16T14:20:00Z',
      },
    ]);

    // 処理を実行
    const result = await retrieveMappingValidationResultsForProject({ projectId });

    // 結果が空配列であることを検証
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});
