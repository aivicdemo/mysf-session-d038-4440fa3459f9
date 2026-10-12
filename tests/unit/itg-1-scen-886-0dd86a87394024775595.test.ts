import { fetchOperationAuditLogsByRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-886: 操作履歴ログ取得 - 1件のみの取得', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象テーブルとレコードIDに合致する操作履歴が1件のみの場合、その1件を返す', async () => {
    const targetTableName = '請求書';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockOperationLogs = [
      {
        操作履歴ID: '660e8400-e29b-41d4-a716-446655440001',
        ユーザーID: '770e8400-e29b-41d4-a716-446655440002',
        操作種別: 'INSERT',
        対象テーブル名: '請求書',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
        変更前値: null,
        変更後値: '{"請求番号": "INV-2025-001", "金額": 100000}',
        操作内容詳細: '請求書を新規作成しました',
        IPアドレス: '192.168.1.100',
        セッションID: 'session-abc123',
        操作ステータス: '成功',
        エラーメッセージ: null,
        操作実行日時: '2025-01-15T10:30:00.000Z',
        id: '660e8400-e29b-41d4-a716-446655440001',
        createdAt: '2025-01-15T10:30:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(
      mockOperationLogs
    );

    const result = await fetchOperationAuditLogsByRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.operationLogs).toHaveLength(1);
    expect(result.operationLogs[0].operationType).toBe('INSERT');
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe(
      '2025-01-15T10:30:00.000Z'
    );
    expect(result.operationLogs[0].userId).toBe(
      '770e8400-e29b-41d4-a716-446655440002'
    );
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
