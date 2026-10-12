import { fetchAnomalyDetectionLogsByType } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-922: 複数の異常タイプが混在するログの中から指定タイプのみが正確にフィルタされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('異常タイプが「金額ズレ」のレコード3件が、検知日時の降順で返される', async () => {
    const mockListRecords = listRecords as jest.Mock;
    const testRecords = [
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440001',
        検知日時: '2026-10-07T10:30:00.000Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440001',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '請求金額が期待値と不一致',
        期待値: '100000',
        実際値: '95000',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T10:30:00.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T10:30:00.000Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440002',
        検知日時: '2026-10-07T08:15:00.000Z',
        異常タイプ: '未請求',
        重要度: '中',
        対象テーブル: '請求書',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440002',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440002',
        異常内容: '請求書が未作成',
        期待値: '作成済み',
        実際値: '未作成',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T08:15:00.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T08:15:00.000Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検know: '550e8400-e29b-41d4-a716-446655440003',
        検知日時: '2026-10-07T12:45:00.000Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440003',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440003',
        異常内容: '小計金額が期待値と不一致',
        期待値: '250000',
        実際値: '240000',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T12:45:00.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T12:45:00.000Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検knowログID: '550e8400-e29b-41d4-a716-446655440004',
        検知日時: '2026-10-07T09:20:00.000Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求書',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440004',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440004',
        異常内容: '請求総額が期待値と不一致',
        期待値: '500000',
        実際値: '480000',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T09:20:00.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T09:20:00.000Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検knowログID: '550e8400-e29b-41d4-a716-446655440005',
        検知日時: '2026-10-07T11:00:00.000Z',
        異常タイプ: 'ステータス不整合',
        重要度: '中',
        対象テーブル: '請求書',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440005',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440005',
        異常内容: 'ステータスが不整合',
        期待値: '確定',
        実際値: '下書き',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T11:00:00.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T11:00:00.000Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
    ];
    mockListRecords.mockResolvedValue(testRecords);

    const input = {
      anomalyType: '金額ズレ',
    };

    const result = await dataPersistence.fetchAnomalyDetectionLogsByType(input);

    expect(result.anomalyLogs).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.anomalyLogs[0].detectionTimestamp).toBe('2026-10-07T12:45:00.000Z');
    expect(result.anomalyLogs[0].anomalyType).toBe('金額ズレ');
    expect(result.anomalyLogs[1].detectionTimestamp).toBe('2026-10-07T10:30:00.000Z');
    expect(result.anomalyLogs[1].anomalyType).toBe('金額ズレ');
    expect(result.anomalyLogs[2].detectionTimestamp).toBe('2026-10-07T09:20:00.000Z');
    expect(result.anomalyLogs[2].anomalyType).toBe('金額ズレ');
  });
});
