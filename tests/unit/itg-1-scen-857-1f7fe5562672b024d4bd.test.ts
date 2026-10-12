import { fetchAllActivityTypes, FetchAllActivityTypesInput, FetchAllActivityTypesOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-857: 取得した活動タイプレコードの totalCount が activityTypes 配列の実際の要素数と一致する', () => {
  it('活動タイプマスタから有効フラグが true の 3 件のレコードが取得され、totalCount が activityTypes 配列の要素数と等しい', async () => {
    const mockData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        activityTypeId: '550e8400-e29b-41d4-a716-446655440001',
        activityTypeName: '電話営業',
        description: '電話による営業活動',
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        activityTypeId: '550e8400-e29b-41d4-a716-446655440002',
        activityTypeName: '訪問営業',
        description: '訪問による営業活動',
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        activityTypeId: '550e8400-e29b-41d4-a716-446655440003',
        activityTypeName: 'メール営業',
        description: 'メールによる営業活動',
        validFlag: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        activityTypeId: '550e8400-e29b-41d4-a716-446655440004',
        activityTypeName: 'オンライン営業',
        description: 'オンラインによる営業活動',
        validFlag: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockData);

    const input: FetchAllActivityTypesInput = {};
    const result = await fetchAllActivityTypes(input);

    expect(result.activityTypes).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.totalCount).toBe(result.activityTypes.length);

    expect(result.activityTypes[0].activityTypeId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.activityTypes[0].activityTypeName).toBe('電話営業');
    expect(result.activityTypes[1].activityTypeId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.activityTypes[1].activityTypeName).toBe('訪問営業');
    expect(result.activityTypes[2].activityTypeId).toBe('550e8400-e29b-41d4-a716-446655440004');
    expect(result.activityTypes[2].activityTypeName).toBe('オンライン営業');
  });
});
