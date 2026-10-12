import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as platformDataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1534: 月次目標値が設定されていないステージがあるとき例外が発生する', () => {
  

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業活動テーブルの読み取り処理がDataStoreErrorで失敗する', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';

    const salesRepresentatives = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '山田太郎',
        emailAddress: 'yamada@example.com',
        phoneNumber: '090-1234-5678',
        department: '営業部',
        jobTitle: '営業課長',
        supervisorId: '660e8400-e29b-41d4-a716-446655440001',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'admin',
      },
    ];

    const dataStoreError = new Error('データアクセスエラー');
    (dataStoreError as any).name = 'DataStoreError';

    jest.spyOn(platformDataStore, 'listRecords')
      .mockResolvedValueOnce(salesRepresentatives as any)
      .mockRejectedValueOnce(dataStoreError);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow();
  });
});
