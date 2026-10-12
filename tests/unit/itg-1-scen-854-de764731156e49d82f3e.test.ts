import { fetchAllActivityTypes, FetchAllActivityTypesInput, FetchAllActivityTypesOutput, ActivityTypeRecord } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-854: 活動タイプマスタに有効フラグが false のレコードのみが存在する場合', () => {
  it('空の一覧と件数 0 と取得時刻を返す', async () => {
    const dataStore = require('../../src/platform/data-store');
    const inactiveRecords = [
      {
        activityTypeId: '550e8400-e29b-41d4-a716-446655440001',
        activityTypeName: '電話',
        description: '電話による営業活動',
        validFlag: false,
        createdAt: '2026-01-01T09:00:00Z',
        updatedAt: '2026-01-15T10:30:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        activityTypeId: '550e8400-e29b-41d4-a716-446655440002',
        activityTypeName: '訪問',
        description: '訪問による営業活動',
        validFlag: false,
        createdAt: '2026-01-01T09:00:00Z',
        updatedAt: '2026-01-15T10:30:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];
    dataStore.listRecords = jest.fn().mockResolvedValue(inactiveRecords);

    const input: FetchAllActivityTypesInput = {};
    const result: FetchAllActivityTypesOutput = await fetchAllActivityTypes(input);

    expect(result.activityTypes).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
