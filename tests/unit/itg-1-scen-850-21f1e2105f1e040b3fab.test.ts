import { fetchAllDealStages } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-850: 返却される各ステージレコードには有効フラグ・ステージ順序・成約ステージフラグ・失注ステージフラグなどの全カラムが含まれている', () => {
  it('各ステージレコードが全カラムを保持している', async () => {
    const mockRecords = [
      {
        id: 'stage-001',
        ステージID: '550e8400-e29b-41d4-a716-446655440001',
        ステージ名: '初期接触',
        ステージ順序: 1,
        説明: '営業初期段階',
        成約ステージフラグ: false,
        失注ステージフラグ: false,
        有効フラグ: true,
        作成日時: '2024-01-01T10:00:00Z',
        更新日時: '2024-01-01T10:00:00Z',
        作成者: 'admin',
        更新者: 'admin',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
      {
        id: 'stage-002',
        ステージID: '550e8400-e29b-41d4-a716-446655440002',
        ステージ名: '提案中',
        ステージ順序: 2,
        説明: '商品提案段階',
        成約ステージフラグ: false,
        失注ステージフラグ: false,
        有効フラグ: true,
        作成日時: '2024-01-01T10:00:00Z',
        更新日時: '2024-01-01T10:00:00Z',
        作成者: 'admin',
        更新者: 'admin',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
      {
        id: 'stage-003',
        ステージID: '550e8400-e29b-41d4-a716-446655440003',
        ステージ名: '成約',
        ステージ順序: 3,
        説明: '取引成立段階',
        成約ステージフラグ: true,
        失注ステージフラグ: false,
        有効フラグ: true,
        作成日時: '2024-01-01T10:00:00Z',
        更新日時: '2024-01-01T10:00:00Z',
        作成者: 'admin',
        更新者: 'admin',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
      {
        id: 'stage-004',
        ステージID: '550e8400-e29b-41d4-a716-446655440004',
        ステージ名: '失注',
        ステージ順序: 4,
        説明: '取引失注段階',
        成約ステージフラグ: false,
        失注ステージフラグ: true,
        有効フラグ: true,
        作成日時: '2024-01-01T10:00:00Z',
        更新日時: '2024-01-01T10:00:00Z',
        作成者: 'admin',
        更新者: 'admin',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(mockRecords);

    const result = (await fetchAllDealStages({} as any)) as any;

    expect(result.stages).toHaveLength(4);

    // 最初のレコード検証
    expect(result.stages[0]).toEqual({
      id: 'stage-001',
      ステージID: '550e8400-e29b-41d4-a716-446655440001',
      ステージ名: '初期接触',
      ステージ順序: 1,
      説明: '営業初期段階',
      成約ステージフラグ: false,
      失注ステージフラグ: false,
      有効フラグ: true,
      作成日時: '2024-01-01T10:00:00Z',
      更新日時: '2024-01-01T10:00:00Z',
      作成者: 'admin',
      更新者: 'admin',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    });
    expect((result.stages[0] as any)['有効フラグ']).toBe(true);
    expect((result.stages[0] as any)['ステージ順序']).toBe(1);
    expect((result.stages[0] as any)['成約ステージフラグ']).toBe(false);
    expect((result.stages[0] as any)['失注ステージフラグ']).toBe(false);

    // 2番目のレコード検証
    expect((result.stages[1] as any)['有効フラグ']).toBe(true);
    expect((result.stages[1] as any)['ステージ順序']).toBe(2);
    expect((result.stages[1] as any)['成約ステージフラグ']).toBe(false);
    expect((result.stages[1] as any)['失注ステージフラグ']).toBe(false);

    // 3番目のレコード検証
    expect((result.stages[2] as any)['有効フラグ']).toBe(true);
    expect((result.stages[2] as any)['ステージ順序']).toBe(3);
    expect((result.stages[2] as any)['成約ステージフラグ']).toBe(true);
    expect((result.stages[2] as any)['失注ステージフラグ']).toBe(false);

    // 4番目のレコード検証
    expect((result.stages[3] as any)['有効フラグ']).toBe(true);
    expect((result.stages[3] as any)['ステージ順序']).toBe(4);
    expect((result.stages[3] as any)['成約ステージフラグ']).toBe(false);
    expect((result.stages[3] as any)['失注ステージフラグ']).toBe(true);

    expect(result.totalCount).toBe(4);
    expect(typeof result.fetchedAt).toBe('string');
  });
});
