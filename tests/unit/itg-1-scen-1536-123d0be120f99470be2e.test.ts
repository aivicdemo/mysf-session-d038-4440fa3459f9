import { fetchActivitiesByRepresentative, SalesRepresentativeNotFound } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1536: 商談IDが空または不正な形式のとき例外が発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('営業担当者IDが空文字列のとき SalesRepresentativeNotFound エラーが発生する', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    // 営業担当者テーブルの前提データ
    const salesRepresentativesData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '営業太郎',
        メールアドレス: 'taro@example.com',
        電話番号: '090-1234-5678',
        部門: '営業部',
        役職: '営業担当者',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
      },
    ];

    // 営業活動テーブルは空
    const activitiesData = [];

    listRecords
      .mockImplementation((tableName) => {
        if (tableName === '営業担当者') {
          return Promise.resolve(salesRepresentativesData);
        }
        if (tableName === '営業活動') {
          return Promise.resolve(activitiesData);
        }
        return Promise.resolve([]);
      });

    const input = {
      salesRepresentativeId: '',
    };

    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow(SalesRepresentativeNotFound);
    await expect(fetchActivitiesByRepresentative(input)).rejects.toThrow('指定された営業担当者が見つかりません。');
  });
});
