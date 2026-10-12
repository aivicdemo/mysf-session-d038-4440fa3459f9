import { fetchAllCustomers } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-841: 取引先テーブルにレコードが複数存在するとき、全レコードを取得して件数と取得日時を含めて返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all customers with count and fetched timestamp', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    const mockCustomers = [
      {
        取引先ID: '550e8400-e29b-41d4-a716-446655440001',
        取引先名: '株式会社A商事',
        取引先名カナ: 'カブシキガイシャエーショウジ',
        取引先区分: '顧客',
        郵便番号: '100-0001',
        住所: '東京都千代田区丸の内1-1-1',
        電話番号: '03-1234-5678',
        メールアドレス: 'contact@a-shoji.jp',
        担当者名: '山田太郎',
        支払条件: '月末締め翌月末払い',
        請求先住所: '東京都千代田区丸の内1-1-1',
        請求先メールアドレス: 'billing@a-shoji.jp',
        ステータス: '有効',
        作成日時: '2024-01-15T09:30:00Z',
        更新日時: '2024-06-20T14:15:00Z',
        作成者: 'admin',
        更新者: 'user001',
      },
      {
        取引先ID: '550e8400-e29b-41d4-a716-446655440002',
        取引先名: '有限会社B産業',
        取引先名カナ: 'ユウゲンガイシャビーサンギョウ',
        取引先区分: '仕入先',
        郵便番号: '200-0002',
        住所: '神奈川県横浜市中区本町2-2-2',
        電話番号: '045-9876-5432',
        メールアドレス: 'info@b-sangyo.jp',
        担当者名: '鈴木花子',
        支払条件: '都度払い',
        請求先住所: '神奈川県横浜市中区本町2-2-2',
        請求先メールアドレス: 'accounts@b-sangyo.jp',
        ステータス: '有効',
        作成日時: '2024-02-10T10:45:00Z',
        更新日時: '2024-05-30T11:20:00Z',
        作成者: 'admin',
        更新者: 'user002',
      },
      {
        取引先ID: '550e8400-e29b-41d4-a716-446655440003',
        取引先名: 'C通商株式会社',
        取引先名カナ: 'シーツウショウカブシキガイシャ',
        取引先区分: '顧客',
        郵便番号: '300-0003',
        住所: '茨城県水戸市宮町3-3-3',
        電話番号: '029-1111-2222',
        メールアドレス: 'sales@c-tusho.jp',
        担当者名: '佐藤次郎',
        支払条件: '月末締め翌々月末払い',
        請求先住所: '茨城県水戸市宮町3-3-3',
        請求先メールアドレス: 'invoice@c-tusho.jp',
        ステータス: '有効',
        作成日時: '2024-03-05T13:00:00Z',
        更新日時: '2024-07-10T16:30:00Z',
        作成者: 'admin',
        更新者: 'user003',
      },
    ];

    mockDataStore.listRecords.mockResolvedValueOnce(mockCustomers);

    const result = await fetchAllCustomers({});

    expect(result.customers).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    expect(result.customers[0].customerId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.customers[0].customerName).toBe('株式会社A商事');
    expect(result.customers[0].customerNameKana).toBe('カブシキガイシャエーショウジ');
    expect(result.customers[0].customerCategory).toBe('顧客');
    expect(result.customers[0].postalCode).toBe('100-0001');
    expect(result.customers[0].address).toBe('東京都千代田区丸の内1-1-1');
    expect(result.customers[0].phoneNumber).toBe('03-1234-5678');
    expect(result.customers[0].emailAddress).toBe('contact@a-shoji.jp');
    expect(result.customers[0].contactPersonName).toBe('山田太郎');
    expect(result.customers[0].paymentTerms).toBe('月末締め翌月末払い');
    expect(result.customers[0].invoiceAddress).toBe('東京都千代田区丸の内1-1-1');
    expect(result.customers[0].invoiceEmailAddress).toBe('billing@a-shoji.jp');
    expect(result.customers[0].status).toBe('有効');
    expect(result.customers[0].createdAt).toBe('2024-01-15T09:30:00Z');
    expect(result.customers[0].updatedAt).toBe('2024-06-20T14:15:00Z');
    expect(result.customers[0].createdBy).toBe('admin');
    expect(result.customers[0].updatedBy).toBe('user001');

    expect(result.customers[1].customerId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(result.customers[1].customerName).toBe('有限会社B産業');

    expect(result.customers[2].customerId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.customers[2].customerName).toBe('C通商株式会社');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
