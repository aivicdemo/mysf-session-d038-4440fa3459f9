import { fetchAnomalyDetectionLogsByType } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-921: 指定された異常タイプに該当するログが1件だけ存在する場合、そのログが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1件のレコードが返され、異常タイプ、検知日時、異常内容が正確である', async () => {
    const mockListRecords = listRecords as jest.Mock;
    const testRecord = {
      異常検知ログID: '550e8400-e29b-41d4-a716-446655440001',
      検知日時: '2026-10-07T10:30:00.000Z',
      異常タイプ: '金額ズレ',
      重要度: '高',
      対象テーブル: '請求明細',
      対象レコードID: '550e8400-e29b-41d4-a716-446655440010',
      検証ルールID: '550e8400-e29b-41d4-a716-446655440020',
      異常内容: '請求金額と計算値が不一致',
      期待値: '100000',
      実際値: '99500',
      ステータス: '未対応',
      対応者ID: null,
      対応日時: null,
      対応コメント: null,
      作成日時: '2026-10-07T10:30:00.000Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440030',
      更新日時: '2026-10-07T10:30:00.000Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440030',
    };
    mockListRecords.mockResolvedValue([testRecord]);

    const input = {
      anomalyType: '金額ズレ',
    };

    const result = await dataPersistence.fetchAnomalyDetectionLogsByType(input);

    expect(result.anomalyLogs).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.anomalyLogs[0].anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.anomalyLogs[0].anomalyType).toBe('金額ズレ');
    expect(result.anomalyLogs[0].detectionTimestamp).toBe('2026-10-07T10:30:00.000Z');
    expect(result.anomalyLogs[0].anomalyContent).toBe('請求金額と計算値が不一致');
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
