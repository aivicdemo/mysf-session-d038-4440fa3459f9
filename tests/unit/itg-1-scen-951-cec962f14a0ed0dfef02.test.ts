import { fetchSalesTargets } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-951: 取得結果の出力型に営業担当者別・取引先別・対象年月の情報が全て含まれている', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('取得結果の出力型に営業担当者別・取引先別・対象年月の情報が全て含まれている', async () => {
    const mockSalesTargets = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440011',
        取引先ID: '550e8400-e29b-41d4-a716-446655440021',
        対象年月: '2024-01',
        目標金額: 5000000,
        目標件数: 10,
        ステータス: 'active',
        備考: 'Q1営業目標',
        作成日時: '2023-12-15T10:30:00Z',
        作成者: 'admin@example.com',
        更新日時: '2024-01-05T14:20:00Z',
        更新者: 'admin@example.com',
        createdAt: '2023-12-15T10:30:00Z',
        updatedAt: '2024-01-05T14:20:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440011',
        取引先ID: '550e8400-e29b-41d4-a716-446655440022',
        対象年月: '2024-01',
        目標金額: 3000000,
        目標件数: 6,
        ステータス: 'active',
        備考: null,
        作成日時: '2023-12-20T09:15:00Z',
        作成者: 'admin@example.com',
        更新日時: '2024-01-03T11:45:00Z',
        更新者: 'admin@example.com',
        createdAt: '2023-12-20T09:15:00Z',
        updatedAt: '2024-01-03T11:45:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440012',
        取引先ID: '550e8400-e29b-41d4-a716-446655440023',
        対象年月: '2024-02',
        目標金額: 4500000,
        目標件数: 9,
        ステータス: 'active',
        備考: 'Q1後半目標',
        作成日時: '2024-01-10T13:00:00Z',
        作成者: 'manager@example.com',
        更新日時: '2024-01-15T16:30:00Z',
        更新者: 'manager@example.com',
        createdAt: '2024-01-10T13:00:00Z',
        updatedAt: '2024-01-15T16:30:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockSalesTargets);

    const result = await fetchSalesTargets({});

    expect(result.salesTargets).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    // 1件目の検証
    expect(result.salesTargets[0]).toMatchObject({
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440011',
      customerId: '550e8400-e29b-41d4-a716-446655440021',
      targetYearMonth: '2024-01',
      targetAmount: 5000000,
      targetCount: 10,
    });

    // 2件目の検証
    expect(result.salesTargets[1]).toMatchObject({
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440011',
      customerId: '550e8400-e29b-41d4-a716-446655440022',
      targetYearMonth: '2024-01',
      targetAmount: 3000000,
      targetCount: 6,
    });

    // 3件目の検証
    expect(result.salesTargets[2]).toMatchObject({
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440012',
      customerId: '550e8400-e29b-41d4-a716-446655440023',
      targetYearMonth: '2024-02',
      targetAmount: 4500000,
      targetCount: 9,
    });
  });
});
