import { saveActivity, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn()
}));

describe('SCEN-728: すべての検証が成功したがデータストアの保存操作が失敗した場合、DataStoreErrorエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DataStoreError エラーが発生し、エラー文言「営業活動の保存に失敗しました。」が返される', async () => {
    const mockListRecords = jest.mocked(dataStore.listRecords);
    const mockCreateRecord = jest.mocked(dataStore.createRecord);

    mockListRecords
      .mockResolvedValueOnce([{ id: 'cust-001', customerId: 'cust-001', status: 'valid' }])
      .mockResolvedValueOnce([{ id: 'rep-001', salesRepresentativeId: 'rep-001', status: 'valid' }])
      .mockResolvedValueOnce([{ id: 'acttype-001', activityTypeName: '訪問', validFlag: true }])
      .mockResolvedValueOnce([{ id: 'actresult-001', activityResultName: '成功', validFlag: true }])
      .mockResolvedValueOnce([{ id: 'actfreq-001', activityFrequencyName: '初回', validFlag: true }]);

    mockCreateRecord.mockRejectedValueOnce(new DataStoreError('営業活動の保存に失敗しました。'));

    await expect(saveActivity({
      activityId: null,
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      activityType: '訪問',
      activityDateTime: '2026-10-07T10:00:00Z',
      activityContent: '顧客との初回打ち合わせを実施',
      activityDurationMinutes: 60,
      activityCount: 1,
      activityFrequency: '初回',
      activityResult: '成功',
      contractedFlag: false,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:30:00Z'
    })).rejects.toThrow(new DataStoreError('営業活動の保存に失敗しました。'));
  });
});
