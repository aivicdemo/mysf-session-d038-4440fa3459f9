import { fetchSalesTargets } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-948: 営業目標マスタテーブルにレコードが存在する場合、全レコードを取得して営業ダッシュボード表示用に返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業目標マスタテーブルから全レコードを取得し、営業ダッシュボード表示用に返す', async () => {
    const mockSalesTargets = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '650e8400-e29b-41d4-a716-446655440001',
        取引先ID: '750e8400-e29b-41d4-a716-446655440001',
        対象年月: '2024-01',
        目標金額: 5000000,
        目標件数: 10,
        ステータス: 'active',
        備考: 'Q1目標',
        作成日時: '2024-01-01T09:00:00Z',
        作成者: 'user001',
        更新日時: '2024-01-01T09:00:00Z',
        更新者: 'user001',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T09:00:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '650e8400-e29b-41d4-a716-446655440002',
        取引先ID: '750e8400-e29b-41d4-a716-446655440002',
        対象年月: '2024-02',
        目標金額: 4500000,
        目標件数: 9,
        ステータス: 'active',
        備考: 'Q1目標',
        作成日時: '2024-01-05T10:30:00Z',
        作成者: 'user002',
        更新日時: '2024-01-05T10:30:00Z',
        更新者: 'user002',
        createdAt: '2024-01-05T10:30:00Z',
        updatedAt: '2024-01-05T10:30:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        営業目標ID: '550e8400-e29b-41d4-a716-446655440003',
        営業担当者ID: '650e8400-e29b-41d4-a716-446655440001',
        取引先ID: '750e8400-e29b-41d4-a716-446655440003',
        対象年月: '2024-03',
        目標金額: 6000000,
        目標件数: 12,
        ステータス: 'active',
        備考: 'Q1目標',
        作成日時: '2024-01-10T14:15:00Z',
        作成者: 'user001',
        更新日時: '2024-01-10T14:15:00Z',
        更新者: 'user001',
        createdAt: '2024-01-10T14:15:00Z',
        updatedAt: '2024-01-10T14:15:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockSalesTargets);

    const result = await fetchSalesTargets({});

    expect(result.salesTargets).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    expect(result.salesTargets[0]).toMatchObject({
      salesRepresentativeId: '650e8400-e29b-41d4-a716-446655440001',
      customerId: '750e8400-e29b-41d4-a716-446655440001',
      targetYearMonth: '2024-01',
      targetAmount: 5000000,
      targetCount: 10,
    });

    expect(result.salesTargets[1]).toMatchObject({
      salesRepresentativeId: '650e8400-e29b-41d4-a716-446655440002',
      customerId: '750e8400-e29b-41d4-a716-446655440002',
      targetYearMonth: '2024-02',
      targetAmount: 4500000,
      targetCount: 9,
    });

    expect(result.salesTargets[2]).toMatchObject({
      salesRepresentativeId: '650e8400-e29b-41d4-a716-446655440001',
      customerId: '750e8400-e29b-41d4-a716-446655440003',
      targetYearMonth: '2024-03',
      targetAmount: 6000000,
      targetCount: 12,
    });

    expect(dataStore.listRecords).toHaveBeenCalledWith('営業目標');
  });
});
