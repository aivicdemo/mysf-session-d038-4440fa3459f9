import { saveCustomer, DataPersistenceError } from '../../src/logic/data-persistence';
import * as platform from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-741: データベースへの保存操作が失敗した場合にエラーを返す', () => {
  it('DataPersistenceErrorが発生し、エラー文言が正しい', async () => {
    const mockDataStore = platform as jest.Mocked<typeof platform>;

    const storeError = new platform.DataStoreError('Database write failed');
    (mockDataStore.listRecords as jest.Mock).mockResolvedValue([]);
    (mockDataStore.createRecord as jest.Mock).mockRejectedValue(storeError);

    const input = {
      customerName: '株式会社テスト',
      currentUserId: 'user-123',
      operationTimestamp: '2026-10-07T10:30:00Z',
    };

    await expect(saveCustomer(input)).rejects.toThrow(DataPersistenceError);
    await expect(saveCustomer(input)).rejects.toThrow('取引先情報の保存に失敗しました。');
  });
});
