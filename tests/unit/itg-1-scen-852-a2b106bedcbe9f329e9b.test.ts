import { fetchAllActivityTypes } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-852: 活動タイプマスタに有効なレコードが存在する場合、有効フラグが true のレコード一覧と件数と取得時刻を返す', () => {
  it('有効フラグが true の3件のレコード（電話営業、訪問営業、提案資料送付）の配列が返される', async () => {
    const mockRecords = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        活動タイプID: '550e8400-e29b-41d4-a716-446655440001',
        活動タイプ名: '電話営業',
        説明: '取引先への電話による営業活動',
        有効フラグ: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-15T14:30:00Z',
        作成者: 'admin',
        更新者: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        活動タイプID: '550e8400-e29b-41d4-a716-446655440002',
        活動タイプ名: '訪問営業',
        説明: '取引先への直接訪問による営業活動',
        有効フラグ: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-15T14:30:00Z',
        作成者: 'admin',
        更新者: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        活動タイプID: '550e8400-e29b-41d4-a716-446655440003',
        活動タイプ名: 'メール営業',
        説明: '取引先へのメール送信による営業活動',
        有効フラグ: false,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-15T14:30:00Z',
        作成者: 'admin',
        更新者: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        活動タイプID: '550e8400-e29b-41d4-a716-446655440004',
        活動タイプ名: '提案資料送付',
        説明: '取引先への提案資料送付',
        有効フラグ: true,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-15T14:30:00Z',
        作成者: 'admin',
        更新者: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(mockRecords);

    const result = (await fetchAllActivityTypes({} as any)) as any;

    // activityTypes に有効フラグが true の 3 件のレコードが返される
    expect(result.activityTypes).toHaveLength(3);

    // 電話営業が含まれている
    expect(result.activityTypes).toContainEqual(
      expect.objectContaining({
        id: '550e8400-e29b-41d4-a716-446655440001',
        活動タイプ名: '電話営業',
        有効フラグ: true,
      })
    );

    // 訪問営業が含まれている
    expect(result.activityTypes).toContainEqual(
      expect.objectContaining({
        id: '550e8400-e29b-41d4-a716-446655440002',
        活動タイプ名: '訪問営業',
        有効フラグ: true,
      })
    );

    // 提案資料送付が含まれている
    expect(result.activityTypes).toContainEqual(
      expect.objectContaining({
        id: '550e8400-e29b-41d4-a716-446655440004',
        活動タイプ名: '提案資料送付',
        有効フラグ: true,
      })
    );

    // 有効フラグが false のメール営業レコードは含まれない
    expect(result.activityTypes).not.toContainEqual(
      expect.objectContaining({
        活動タイプ名: 'メール営業',
      })
    );

    // totalCount に 3 が返される
    expect(result.totalCount).toBe(3);

    // fetchedAt に ISO 8601 形式の現在日時が返される
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
