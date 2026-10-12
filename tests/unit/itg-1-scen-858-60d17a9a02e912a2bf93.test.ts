import { fetchAllActivityTypes, FetchAllActivityTypesInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-858: fetchedAt は ISO 8601 形式の有効な日時文字列である', () => {
  it('fetchedAt が ISO 8601 形式の有効な日時文字列で返される', async () => {
    const mockData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        activityTypeId: '550e8400-e29b-41d4-a716-446655440001',
        activityTypeName: '電話営業',
        description: '顧客への電話による営業活動',
        validFlag: true,
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T09:30:00Z',
        createdBy: 'user001',
        updatedBy: 'user001',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        activityTypeId: '550e8400-e29b-41d4-a716-446655440002',
        activityTypeName: '訪問営業',
        description: '顧客への訪問による営業活動',
        validFlag: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user002',
        updatedBy: 'user002',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        activityTypeId: '550e8400-e29b-41d4-a716-446655440003',
        activityTypeName: '廃止活動タイプ',
        description: '使用されなくなった活動タイプ',
        validFlag: false,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
        createdBy: 'user001',
        updatedBy: 'user003',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockData);

    const input: FetchAllActivityTypesInput = {};
    const result = await fetchAllActivityTypes(input);

    expect(result.activityTypes).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);

    const fetchedDate = new Date(result.fetchedAt);
    expect(fetchedDate).toBeInstanceOf(Date);
    expect(fetchedDate.toISOString().match(iso8601Regex)).toBeTruthy();

    expect(result.activityTypes[0].validFlag).toBe(true);
    expect(result.activityTypes[1].validFlag).toBe(true);
  });
});
