import { fetchAllActivityResults, FetchAllActivityResultsInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-863: データ取得時刻が ISO 8601 形式で返される', () => {
  it('有効フラグが true の 2 件のレコードが返され、fetchedAt が ISO 8601 形式の日時文字列である', async () => {
    const mockData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        activityResultId: '550e8400-e29b-41d4-a716-446655440001',
        activityResultName: '商談成立',
        description: '商談が成立した',
        validFlag: true,
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T10:30:00Z',
        createdBy: 'user001',
        updatedBy: 'user001',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        activityResultId: '550e8400-e29b-41d4-a716-446655440002',
        activityResultName: '商談保留',
        description: '商談を保留にした',
        validFlag: true,
        createdAt: '2026-01-15T11:00:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
        createdBy: 'user002',
        updatedBy: 'user002',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        activityResultId: '550e8400-e29b-41d4-a716-446655440003',
        activityResultName: '商談失注',
        description: '商談が失注した',
        validFlag: false,
        createdAt: '2026-01-15T11:30:00Z',
        updatedAt: '2026-01-15T11:30:00Z',
        createdBy: 'user003',
        updatedBy: 'user003',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockData);

    const input: FetchAllActivityResultsInput = {};
    const result = await fetchAllActivityResults(input);

    expect(result.activityResults).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    expect(result.activityResults[0].activityResultId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.activityResults[0].activityResultName).toBe('商談成立');

    expect(result.activityResults[1].activityResultId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.activityResults[1].activityResultName).toBe('商談保留');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);

    const fetchedDate = new Date(result.fetchedAt);
    expect(fetchedDate).toBeInstanceOf(Date);
    expect(fetchedDate.toISOString().match(iso8601Regex)).toBeTruthy();
  });
});
