import { fetchActivitiesByRepresentative, DataStoreError, type FetchActivitiesByRepresentativeInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1550: ファイルアップロード失敗時にユーザーに失敗メッセージが表示される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動テーブルの読み取りがDataStoreErrorで失敗した場合、DataStoreErrorエラーが発生し、エラー文言「営業活動データの取得に失敗しました。」が返される', async () => {
    const salesRepresentativeId = 'rep-001';
    const salesRepData = [
      {
        salesRepresentativeId: 'rep-001',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: 'mgr-001',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin',
        updatedBy: null,
      },
    ];

    mockDataStore.listRecords.mockImplementation((tableName: string) => {
      if (tableName === '営業活動') {
        throw new DataStoreError('営業活動データの取得に失敗しました。');
      }
      if (tableName === '営業担当者') {
        return Promise.resolve(salesRepData);
      }
      return Promise.resolve([]);
    });

    const input: FetchActivitiesByRepresentativeInput = {
      salesRepresentativeId,
    };

    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow(
      new DataStoreError('営業活動データの取得に失敗しました。')
    );
  });
});
