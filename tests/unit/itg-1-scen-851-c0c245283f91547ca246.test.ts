import { fetchAllDealStages } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-851: fetchedAtに取得時刻がISO 8601形式で設定される', () => {
  it('fetchedAt フィールドに ISO 8601形式の文字列が設定され、ステージがソートされている', async () => {
    const mockRecords = [
      {
        id: 'stage-001',
        ステージID: '550e8400-e29b-41d4-a716-446655440001',
        ステージ名: '初期接触',
        ステージ順序: 1,
        説明: '取引先との初回接触',
        成約ステージフラグ: false,
        失注ステージフラグ: false,
        有効フラグ: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        作成者: 'system',
        更新者: 'system',
      },
      {
        id: 'stage-002',
        ステージID: '550e8400-e29b-41d4-a716-446655440002',
        ステージ名: '提案',
        ステージ順序: 2,
        説明: '提案資料を提出',
        成約ステージフラグ: false,
        失注ステージフラグ: false,
        有効フラグ: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        作成者: 'system',
        更新者: 'system',
      },
      {
        id: 'stage-003',
        ステージID: '550e8400-e29b-41d4-a716-446655440003',
        ステージ名: '成約',
        ステージ順序: 3,
        説明: '契約締結',
        成約ステージフラグ: true,
        失注ステージフラグ: false,
        有効フラグ: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        作成者: 'system',
        更新者: 'system',
      },
      {
        id: 'stage-004',
        ステージID: '550e8400-e29b-41d4-a716-446655440004',
        ステージ名: '失注',
        ステージ順序: 4,
        説明: '商談終了（成約に至らず）',
        成約ステージフラグ: false,
        失注ステージフラグ: true,
        有効フラグ: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        作成者: 'system',
        更新者: 'system',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(mockRecords);

    const result = (await fetchAllDealStages({} as any)) as any;

    // fetchedAt が ISO 8601形式であることを確認
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);

    // stages に4件のレコードがステージ順序でソートされていることを確認
    expect(result.stages).toHaveLength(4);
    expect((result.stages[0] as any)['ステージ順序']).toBe(1);
    expect((result.stages[1] as any)['ステージ順序']).toBe(2);
    expect((result.stages[2] as any)['ステージ順序']).toBe(3);
    expect((result.stages[3] as any)['ステージ順序']).toBe(4);

    // totalCount に 4 が設定されていることを確認
    expect(result.totalCount).toBe(4);
  });
});
