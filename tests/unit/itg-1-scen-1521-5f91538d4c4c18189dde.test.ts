import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1521: 請求金額が商談金額を超えるとき例外が発生する', () => {
  it('このテスト仕様は対象処理の契約外です', async () => {
    const salesRepresentativeId = '550e8400-e29b-41d4-a716-446655440000';
    const salesRepresentativeRecords = [
      {
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        名前: '山田太郎',
        メールアドレス: 'yamada@example.com',
        電話番号: '09012345678',
        部門: '営業部',
        役職: '営業課長',
        上司ID: '550e8400-e29b-41d4-a716-446655440001',
        ステータス: 'active',
      },
    ];
    const activitiesRecords = [
      {
        営業活動ID: '660e8400-e29b-41d4-a716-446655440000',
        取引先ID: '770e8400-e29b-41d4-a716-446655440000',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '商談提案',
        活動日時: '2025-12-15T10:30:00Z',
        活動内容: '商品提案実施',
        次回フォローアップ予定日: '2025-12-22T10:00:00Z',
        商談ステージ: '提案段階',
        見積金額: 1500000,
        成約フラグ: false,
        商談ID: '880e8400-e29b-41d4-a716-446655440000',
        活動時間: 120,
        活動件数: 1,
        活動頻度: '定期',
        活動結果: '提案完了',
        次のアクション: '顧客からの返答待ち',
      },
      {
        営業活動ID: '661e8400-e29b-41d4-a716-446655440001',
        取引先ID: '771e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440000',
        活動種別: '請求確認',
        活動日時: '2025-12-10T14:00:00Z',
        活動内容: '請求金額確認',
        次回フォローアップ予定日: '2025-12-17T14:00:00Z',
        商談ステージ: '成約',
        見積金額: 1000000,
        成約フラグ: true,
        商談ID: '881e8400-e29b-41d4-a716-446655440001',
        活動時間: 60,
        活動件数: 1,
        活動頻度: '単発',
        活動結果: '確認完了',
        次のアクション: '請求書発行',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((table: string) => {
      if (table === '営業担当者') {
        return Promise.resolve(salesRepresentativeRecords);
      }
      if (table === '営業活動') {
        return Promise.resolve(activitiesRecords);
      }
      return Promise.resolve([]);
    });

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.activities).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();
  });
});
