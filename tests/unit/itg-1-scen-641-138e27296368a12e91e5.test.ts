import { recordModificationWithHistory, IncompleteModificationDetails } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-641: 修正理由が空文字列またはnullの場合', () => {
  it('IncompleteModificationDetailsエラーを返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '550e8400-e29b-41d4-a716-446655440010',
      取引先ID: '550e8400-e29b-41d4-a716-446655440020',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
      請求書番号: 'INV-2026-001',
      請求日: '2026-10-01T09:00:00Z',
      支払期限日: '2026-11-01T09:00:00Z',
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: '未払い',
      入金日: null,
      入金金額: null,
      摘要: '通常請求',
      作成日時: '2026-10-01T08:00:00Z',
      更新日時: '2026-10-01T08:00:00Z',
      作成者: 'admin',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '完了',
      金額計算検証日時: '2026-10-01T09:00:00Z',
      参照関係検証ステータス: '完了',
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    };

    const userData = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      ユーザーID: '550e8400-e29b-41d4-a716-446655440001',
      ログインID: 'sales_user_001',
      パスワードハッシュ: '$2b$10$hashed_password_here',
      ユーザー名: '営業太郎',
      メールアドレス: 'taro@example.com',
      ロール: '営業担当者',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440001',
      有効フラグ: true,
      最終ログイン日時: '2026-10-07T09:00:00Z',
      作成日時: '2026-09-01T00:00:00Z',
      更新日時: '2026-10-07T09:00:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440099',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-10-07T09:00:00Z',
    };

    const mockListRecords = jest.fn((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'ユーザー') {
        return Promise.resolve([userData]);
      }
      return Promise.resolve([]);
    });

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);

    await expect(
      recordModificationWithHistory({
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationDetails: [
          {
            fieldName: '請求金額',
            previousValue: '100000',
            newValue: '110000',
          },
        ],
        modificationReason: '',
        modificationDateTime: new Date('2026-10-07T10:00:00Z'),
        currentDateTime: new Date('2026-10-07T10:30:00Z'),
        modifierUserId: '550e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow(IncompleteModificationDetails);
  });
});
