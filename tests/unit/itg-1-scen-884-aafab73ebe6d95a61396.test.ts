import { fetchOperationAuditLogsByRecord, TargetRecordNotFound } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-884: 操作履歴ログ取得 - 対象レコードが存在しないエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('対象テーブルとレコードIDに合致する操作履歴が存在しない場合、TargetRecordNotFoundが発生', async () => {
    const targetTableName = 'invoice';
    const targetRecordId = '550e8400-e29b-41d4-a716-446655440000';

    const mockOperationLogs = [
      {
        操作履歴ID: '660e8400-e29b-41d4-a716-446655440001',
        ユーザーID: '770e8400-e29b-41d4-a716-446655440002',
        操作種別: 'UPDATE',
        対象テーブル名: 'customer',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440100',
        変更前値: '{"status":"active"}',
        変更後値: '{"status":"inactive"}',
        操作内容詳細: '顧客ステータスを変更',
        IPアドレス: '192.168.1.1',
        セッションID: 'session-001',
        操作ステータス: 'SUCCESS',
        エラーメッセージ: null,
        操作実行日時: '2026-10-01T10:00:00Z',
      },
      {
        操作履歴ID: '660e8400-e29b-41d4-a716-446655440003',
        ユーザーID: '770e8400-e29b-41d4-a716-446655440004',
        操作種別: 'INSERT',
        対象テーブル名: 'opportunity',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440200',
        変更前値: null,
        変更後値: '{"amount":100000,"stage":"Negotiation"}',
        操作内容詳細: '商談を新規作成',
        IPアドレス: '192.168.1.2',
        セッションID: 'session-002',
        操作ステータス: 'SUCCESS',
        エラーメッセージ: null,
        操作実行日時: '2026-10-01T11:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(
      mockOperationLogs
    );

    await expect(
      fetchOperationAuditLogsByRecord({
        targetTableName,
        targetRecordId,
      })
    ).rejects.toBeInstanceOf(TargetRecordNotFound);
  });
});
