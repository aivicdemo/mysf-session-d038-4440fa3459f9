import { fetchActivitiesByRepresentative, SalesRepresentativeNotFound } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1514: 営業担当者IDが空または不正なときに警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者IDが空文字列の場合、SalesRepresentativeNotFoundエラーが発生する', async () => {
    const salesRepresentativeId = '';

    const salesRepresentatives = [
      {
        営業担当者ID: 'rep-001',
        名前: '山田太郎',
        メールアドレス: 'yamada@company.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: 'rep-000',
        ステータス: 'active',
      },
    ];

    (dataPersistence.listRecords as jest.Mock)
      .mockResolvedValueOnce(salesRepresentatives);

    await expect(
      fetchActivitiesByRepresentative({ salesRepresentativeId })
    ).rejects.toThrow(SalesRepresentativeNotFound);
  });
});
