import { fetchAllActivityTypes, FetchAllActivityTypesInput, FetchAllActivityTypesOutput, ActivityTypeRecord } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-855: 活動タイプマスタに有効フラグが true と false が混在する場合', () => {
  it('true のレコードのみを返す', async () => {
    const dataStore = require('../../src/platform/data-store');
    const mixedRecords = [
      {
        activityTypeId: '550e8400-e29b-41d4-a716-446655440001',
        activityTypeName: '電話営業',
        description: '顧客への電話による営業活動',
        validFlag: true,
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-15T08:30:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        activityTypeId: '550e8400-e29b-41d4-a716-446655440002',
        activityTypeName: 'メール営業',
        description: '顧客へのメール送信',
        validFlag: false,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
        createdBy: 'admin',
        updatedBy: 'user1',
      },
      {
        activityTypeId: '550e8400-e29b-41d4-a716-446655440003',
        activityTypeName: '訪問営業',
        description: '顧客先への訪問',
        validFlag: true,
        createdAt: '2024-01-12T10:15:00Z',
        updatedAt: '2024-01-12T10:15:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
      {
        activityTypeId: '550e8400-e29b-41d4-a716-446655440004',
        activityTypeName: 'セミナー参加',
        description: '顧客がセミナーに参加',
        validFlag: false,
        createdAt: '2024-01-08T11:45:00Z',
        updatedAt: '2024-01-13T16:30:00Z',
        createdBy: 'admin',
        updatedBy: 'user2',
      },
      {
        activityTypeId: '550e8400-e29b-41d4-a716-446655440005',
        activityTypeName: '提案資料送付',
        description: '顧客への提案資料の送付',
        validFlag: true,
        createdAt: '2024-01-18T13:20:00Z',
        updatedAt: '2024-01-18T13:20:00Z',
        createdBy: 'admin',
        updatedBy: 'admin',
      },
    ];
    dataStore.listRecords = jest.fn().mockResolvedValue(mixedRecords);

    const input: FetchAllActivityTypesInput = {};
    const result: FetchAllActivityTypesOutput = await fetchAllActivityTypes(input);

    expect(result.activityTypes).toHaveLength(3);
    expect(result.activityTypes[0].activityTypeId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.activityTypes[0].activityTypeName).toBe('電話営業');
    expect(result.activityTypes[0].validFlag).toBe(true);
    expect(result.activityTypes[1].activityTypeId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.activityTypes[1].activityTypeName).toBe('訪問営業');
    expect(result.activityTypes[1].validFlag).toBe(true);
    expect(result.activityTypes[2].activityTypeId).toBe('550e8400-e29b-41d4-a716-446655440005');
    expect(result.activityTypes[2].activityTypeName).toBe('提案資料送付');
    expect(result.activityTypes[2].validFlag).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
