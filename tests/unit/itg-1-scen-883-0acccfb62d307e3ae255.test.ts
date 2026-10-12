import { fetchOperationAuditLogsByRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-883: 操作履歴ログ取得 - 複数件の降順ソート', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('操作実行日時の降順でソート済みの配列を返す', async () => {
    const targetTableName = '商談';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockOperationLogs = [
      {
        操作履歴ID: '11111111-1111-1111-1111-111111111111',
        ユーザーID: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        操作種別: 'UPDATE',
        対象テーブル名: '商談',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
        変更前値: '{"金額": 100000}',
        変更後値: '{"金額": 150000}',
        操作内容詳細: '金額を更新',
        IPアドレス: '192.168.1.100',
        セッションID: 'sess_001',
        操作ステータス: '成功',
        エラーメッセージ: null,
        操作実行日時: '2026-01-15T10:30:00Z',
        id: '11111111-1111-1111-1111-111111111111',
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T10:30:00Z',
      },
      {
        操作履歴ID: '22222222-2222-2222-2222-222222222222',
        ユーザーID: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        操作種別: 'UPDATE',
        対象テーブル名: '商談',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
        変更前値: '{"ステータス": "検討中"}',
        変更後値: '{"ステータス": "成約"}',
        操作内容詳細: 'ステータスを更新',
        IPアドレス: '192.168.1.101',
        セッションID: 'sess_002',
        操作ステータス: '成功',
        エラーメッセージ: null,
        操作実行日時: '2026-01-15T14:45:30Z',
        id: '22222222-2222-2222-2222-222222222222',
        createdAt: '2026-01-15T14:45:30Z',
        updatedAt: '2026-01-15T14:45:30Z',
      },
      {
        操作履歴ID: '33333333-3333-3333-3333-333333333333',
        ユーザーID: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        操作種別: 'CREATE',
        対象テーブル名: '商談',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
        変更前値: null,
        変更後値: '{"商談名": "A社案件", "金額": 100000, "ステータス": "検討中"}',
        操作内容詳細: '新規作成',
        IPアドレス: '192.168.1.102',
        セッションID: 'sess_003',
        操作ステータス: '成功',
        エラーメッセージ: null,
        操作実行日時: '2026-01-15T09:00:00Z',
        id: '33333333-3333-3333-3333-333333333333',
        createdAt: '2026-01-15T09:00:00Z',
        updatedAt: '2026-01-15T09:00:00Z',
      },
      {
        操作履歴ID: '44444444-4444-4444-4444-444444444444',
        ユーザーID: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        操作種別: 'UPDATE',
        対象テーブル名: '商談',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440001',
        変更前値: '{"金額": 200000}',
        変更後値: '{"金額": 250000}',
        操作内容詳細: '金額を更新',
        IPアドレス: '192.168.1.103',
        セッションID: 'sess_004',
        操作ステータス: '成功',
        エラーメッセージ: null,
        操作実行日時: '2026-01-15T11:00:00Z',
        id: '44444444-4444-4444-4444-444444444444',
        createdAt: '2026-01-15T11:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(
      mockOperationLogs
    );

    const result = await fetchOperationAuditLogsByRecord({
      targetTableName,
      targetRecordId,
    });

    expect(result.operationLogs).toHaveLength(3);
    expect(result.operationLogs[0].operationExecutionTimestamp).toBe(
      '2026-01-15T14:45:30Z'
    );
    expect(result.operationLogs[1].operationExecutionTimestamp).toBe(
      '2026-01-15T10:30:00Z'
    );
    expect(result.operationLogs[2].operationExecutionTimestamp).toBe(
      '2026-01-15T09:00:00Z'
    );
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
