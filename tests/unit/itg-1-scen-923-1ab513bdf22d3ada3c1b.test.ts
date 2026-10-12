import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-923: 指定期間内の異常検知ログを検知日時の降順で取得できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検知日時の降順で3件のレコードが返され、期間外のレコードは含まれない', async () => {
    const mockListRecords = listRecords as jest.Mock;
    const testRecords = [
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440001',
        検知日時: '2024-01-15T14:30:00Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440001',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '請求額が注文額と一致しない',
        期待値: '100000',
        実際値: '95000',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2024-01-15T14:30:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2024-01-15T14:30:00Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440002',
        検知日時: '2024-01-10T10:15:00Z',
        異常タイプ: '未請求',
        重要度: '中',
        対象テーブル: '商談',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440002',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440002',
        異常内容: 'クローズ済み商談に対応する請求書が存在しない',
        期待値: '請求書ID存在',
        実際値: '請求書ID未設定',
        ステータス: '対応済み',
        対応者ID: '990e8400-e29b-41d4-a716-446655440001',
        対応日時: '2024-01-12T09:00:00Z',
        対応コメント: '手動で請求書を生成しました',
        作成日時: '2024-01-10T10:15:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2024-01-12T09:00:00Z',
        更新者ID: '990e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440003',
        検知日時: '2024-01-20T16:45:00Z',
        異常タイプ: 'ステータス不整合',
        重要度: '低',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440003',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440003',
        異常内容: '請求ステータスと支払いステータスが不一致',
        期待値: '支払済み',
        実際値: '未支払い',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2024-01-20T16:45:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2024-01-20T16:45:00Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440004',
        検知日時: '2023-12-25T08:00:00Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440004',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440004',
        異常内容: '税金計算エラー',
        期待値: '10000',
        実際値: '12000',
        ステータス: '対応済み',
        対応者ID: '990e8400-e29b-41d4-a716-446655440002',
        対応日時: '2023-12-26T10:00:00Z',
        対応コメント: '税率を訂正しました',
        作成日時: '2023-12-25T08:00:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2023-12-26T10:00:00Z',
        更新者ID: '990e8400-e29b-41d4-a716-446655440002',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440005',
        検知日時: '2024-02-05T11:20:00Z',
        異常タイプ: '未請求',
        重要度: '高',
        対象テーブル: '商談',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440005',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440005',
        異常内容: '納期超過の商談に対応する請求書が存在しない',
        期待値: '請求書ID存在',
        実際値: '請求書ID未設定',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2024-02-05T11:20:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2024-02-05T11:20:00Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
    ];
    mockListRecords.mockResolvedValue(testRecords);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime' as const,
    };

    const result = await dataPersistence.fetchAnomalyDetectionLogsByPeriod(input);

    expect(result.anomalyLogs).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.anomalyLogs[0].detectionTimestamp).toBe('2024-01-20T16:45:00Z');
    expect(result.anomalyLogs[1].detectionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.anomalyLogs[2].detectionTimestamp).toBe('2024-01-10T10:15:00Z');
    expect(result.fetchedAt).toBeDefined();
  });
});
