import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchActivitiesByRepresentative } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1544: 要求されたデータ範囲が全社データで営業部長権限のみのとき部門内データのみが表示される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only sales division manager activities and exclude subordinate and other division activities', async () => {
    const salesRepresentativeId = '営業部長A-uuid';

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords
      .mockResolvedValueOnce([
        {
          id: '営業部長A-uuid',
          営業担当者ID: '営業部長A-uuid',
          名前: '山田太郎',
          メールアドレス: 'yamada@company.com',
          電話番号: '090-1234-5678',
          部門: '営業部',
          役職: '部長',
          上司ID: '営業本部長-uuid',
          ステータス: 'active'
        },
        {
          id: '営業担当者B-uuid',
          営業担当者ID: '営業担当者B-uuid',
          名前: '鈴木花子',
          メールアドレス: 'suzuki@company.com',
          電話番号: '090-2345-6789',
          部門: '営業部',
          役職: '営業',
          上司ID: '営業部長A-uuid',
          ステータス: 'active'
        },
        {
          id: '営業担当者C-uuid',
          営業担当者ID: '営業担当者C-uuid',
          名前: '佐藤次郎',
          メールアドレス: 'sato@company.com',
          電話番号: '090-3456-7890',
          部門: '営業部',
          役職: '営業',
          上司ID: '営業部長A-uuid',
          ステータス: 'active'
        },
        {
          id: '営業担当者D-uuid',
          営業担当者ID: '営業担当者D-uuid',
          名前: '田中三郎',
          メールアドレス: 'tanaka@company.com',
          電話番号: '090-4567-8901',
          部門: '企画部',
          役職: '営業',
          上司ID: '企画部長-uuid',
          ステータス: 'active'
        }
      ])
      .mockResolvedValueOnce([
        {
          id: 'activity-1-uuid',
          営業活動ID: 'activity-1-uuid',
          取引先ID: 'client-1-uuid',
          営業担当者ID: '営業部長A-uuid',
          活動種別: '訪問',
          活動日時: '2025-01-15T14:30:00Z',
          活動内容: '新規営業提案',
          次回フォローアップ予定日: '2025-01-22T09:00:00Z',
          商談ステージ: '提案',
          見積金額: 500000,
          成約フラグ: false,
          商談ID: 'deal-1-uuid',
          活動時間: 120,
          活動件数: 1,
          活動頻度: '初回',
          活動結果: '良好',
          次のアクション: '提案資料を送付'
        },
        {
          id: 'activity-2-uuid',
          営業活動ID: 'activity-2-uuid',
          取引先ID: 'client-2-uuid',
          営業担当者ID: '営業部長A-uuid',
          活動種別: '電話',
          活動日時: '2025-01-10T10:15:00Z',
          活動内容: '既存顧客フォローアップ',
          次回フォローアップ予定日: '2025-01-20T15:00:00Z',
          商談ステージ: '商談中',
          見積金額: 300000,
          成約フラグ: false,
          商談ID: 'deal-2-uuid',
          活動時間: 45,
          活動件数: 1,
          活動頻度: '定期',
          活動結果: '継続',
          次のアクション: '見積書を確認'
        },
        {
          id: 'activity-3-uuid',
          営業活動ID: 'activity-3-uuid',
          取引先ID: 'client-3-uuid',
          営業担当者ID: '営業担当者B-uuid',
          活動種別: '訪問',
          活動日時: '2025-01-12T13:00:00Z',
          活動内容: '契約説明',
          次回フォローアップ予定日: '2025-01-25T10:00:00Z',
          商談ステージ: '契約',
          見積金額: 700000,
          成約フラグ: true,
          商談ID: 'deal-3-uuid',
          活動時間: 90,
          活動件数: 1,
          活動頻度: '初回',
          活動結果: '成功',
          次のアクション: '契約書送付'
        },
        {
          id: 'activity-4-uuid',
          営業活動ID: 'activity-4-uuid',
          取引先ID: 'client-4-uuid',
          営業担当者ID: '営業担当者D-uuid',
          活動種別: '訪問',
          活動日時: '2025-01-08T11:30:00Z',
          活動内容: '初期接触',
          次回フォローアップ予定日: '2025-01-18T14:00:00Z',
          商談ステージ: '初期接触',
          見積金額: 200000,
          成約フラグ: false,
          商談ID: 'deal-4-uuid',
          活動時間: 60,
          活動件数: 1,
          活動頻度: '初回',
          活動結果: '情報提供',
          次のアクション: '資料提供待ち'
        }
      ]);

    const result = await fetchActivitiesByRepresentative({ salesRepresentativeId });

    expect(result.totalCount).toBe(2);
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].salesRepresentativeId).toBe('営業部長A-uuid');
    expect(result.activities[1].salesRepresentativeId).toBe('営業部長A-uuid');
    expect(result.activities[0].activityDateTime).toBe('2025-01-15T14:30:00Z');
    expect(result.activities[1].activityDateTime).toBe('2025-01-10T10:15:00Z');
  });
});
