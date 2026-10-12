import { fetchAllActivityResults, FetchAllActivityResultsInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-862: 取得したレコードの総件数が totalCount に反映される', () => {
  it('有効フラグが true の 3 件のレコードが返され、totalCount が 3 に設定される', async () => {
    const mockData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        activityResultId: '550e8400-e29b-41d4-a716-446655440001',
        activityResultName: '商談成立',
        description: '営業活動の結果が商談成立となった場合',
        validFlag: true,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        activityResultId: '550e8400-e29b-41d4-a716-446655440002',
        activityResultName: '商談失敗',
        description: '営業活動の結果が商談失敗となった場合',
        validFlag: true,
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-02T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        activityResultId: '550e8400-e29b-41d4-a716-446655440003',
        activityResultName: '保留中',
        description: '営業活動の結果が保留中となった場合',
        validFlag: true,
        createdAt: '2026-01-03T10:00:00Z',
        updatedAt: '2026-01-03T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        activityResultId: '550e8400-e29b-41d4-a716-446655440004',
        activityResultName: '廃止済み',
        description: 'このレコードは廃止されました',
        validFlag: false,
        createdAt: '2026-01-04T10:00:00Z',
        updatedAt: '2026-01-04T10:00:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockData);

    const input: FetchAllActivityResultsInput = {};
    const result = await fetchAllActivityResults(input);

    expect(result.activityResults).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.totalCount).toBe(result.activityResults.length);

    expect(result.activityResults[0].activityResultId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.activityResults[1].activityResultId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.activityResults[2].activityResultId).toBe('550e8400-e29b-41d4-a716-446655440003');

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);

    expect(result.activityResults.every(r => r.validFlag === true)).toBe(true);
  });
});
