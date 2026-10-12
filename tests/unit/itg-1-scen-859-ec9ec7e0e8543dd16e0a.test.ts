import { fetchAllActivityResults, FetchAllActivityResultsInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-859: 有効フラグが true のレコードのみ取得できる', () => {
  it('activityResults には有効フラグが true のレコードのみが含まれ、totalCount と fetchedAt が正しく返される', async () => {
    const mockData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        activityResultId: '550e8400-e29b-41d4-a716-446655440001',
        activityResultName: '商談成立',
        description: '営業活動の結果として商談が成立した場合',
        validFlag: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        activityResultId: '550e8400-e29b-41d4-a716-446655440002',
        activityResultName: '商談失敗',
        description: '営業活動の結果として商談が失敗した場合',
        validFlag: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        activityResultId: '550e8400-e29b-41d4-a716-446655440003',
        activityResultName: 'アプローチ予定',
        description: '営業活動でアプローチを予定している場合',
        validFlag: true,
        createdAt: '2024-01-16T09:30:00Z',
        updatedAt: '2024-01-16T09:30:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        activityResultId: '550e8400-e29b-41d4-a716-446655440004',
        activityResultName: '廃止予定結果',
        description: '今後使用しない活動結果',
        validFlag: false,
        createdAt: '2024-01-10T14:00:00Z',
        updatedAt: '2024-01-10T14:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockData);

    const input: FetchAllActivityResultsInput = {};
    const result = await fetchAllActivityResults(input);

    expect(result.activityResults).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    expect(result.activityResults[0].activityResultId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.activityResults[0].activityResultName).toBe('商談成立');
    expect(result.activityResults[0].validFlag).toBe(true);

    expect(result.activityResults[1].activityResultId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.activityResults[1].activityResultName).toBe('アプローチ予定');
    expect(result.activityResults[1].validFlag).toBe(true);

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);

    expect(result.activityResults.every(r => r.validFlag === true)).toBe(true);
  });
});
