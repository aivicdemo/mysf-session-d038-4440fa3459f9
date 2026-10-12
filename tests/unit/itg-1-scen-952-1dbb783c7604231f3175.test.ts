import { fetchSalesTargets } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-952: 取得実行日時がISO 8601形式でfetchedAtフィールドに設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchedAtフィールドにISO 8601形式の日時が設定される', async () => {
    const mockSalesTargets = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440101',
        取引先ID: '550e8400-e29b-41d4-a716-446655440201',
        対象年月: '2026-01',
        目標金額: 5000000,
        目標件数: 10,
        ステータス: 'active',
        備考: 'Q1目標',
        作成日時: '2025-12-01T09:00:00Z',
        作成者: 'admin',
        更新日時: '2025-12-15T14:30:00Z',
        更新者: 'admin',
        createdAt: '2025-12-01T09:00:00Z',
        updatedAt: '2025-12-15T14:30:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440102',
        取引先ID: '550e8400-e29b-41d4-a716-446655440202',
        対象年月: '2026-02',
        目標金額: 3000000,
        目標件数: 6,
        ステータス: 'active',
        備考: 'Q1目標',
        作成日時: '2025-12-01T09:00:00Z',
        作成者: 'admin',
        更新日時: '2025-12-15T14:30:00Z',
        更新者: 'admin',
        createdAt: '2025-12-01T09:00:00Z',
        updatedAt: '2025-12-15T14:30:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockSalesTargets);

    const result = await fetchSalesTargets({});

    expect(result.salesTargets).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // fetchedAtがISO 8601形式であることを確認
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    // ISO 8601形式として有効な日時をパースできることを確認
    const parsedDate = new Date(result.fetchedAt);
    expect(parsedDate).not.toBeNaN();
    expect(parsedDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
