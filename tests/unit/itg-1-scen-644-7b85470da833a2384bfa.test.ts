import { recordModificationWithHistory, DataStoreError } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-644: 請求書修正内容テーブルへの書き込みに失敗した場合', () => {
  it('DataStoreErrorエラーを返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '550e8400-e29b-41d4-a716-446655440002',
      取引先ID: '550e8400-e29b-41d4-a716-446655440003',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440004',
      請求書番号: 'INV-2025-0001',
      請求日: '2025-01-10T09:00:00Z',
      支払期限日: '2025-02-10T23:59:59Z',
      請求金額: '100000',
      税額: '10000',
      税抜金額: '90000',
      請求ステータス: '未入金',
      入金日: null,
      入金金額: null,
      摘要: '通常請求',
      作成日時: '2025-01-09T08:00:00Z',
      更新日時: '2025-01-09T08:00:00Z',
      作成者: 'system',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '完了',
      金額計算検証日時: '2025-01-09T08:30:00Z',
      参照関係検証ステータス: '完了',
      createdAt: '2025-01-09T08:00:00Z',
      updatedAt: '2025-01-09T08:00:00Z',
    };

    const userData = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
      ログインID: 'user_sales_001',
      パスワードハッシュ: '$2b$10$hashedpassword',
      ユーザー名: '営業担当者A',
      メールアドレス: 'sales_a@company.com',
      ロール: '営業担当者',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440004',
      有効フラグ: true,
      最終ログイン日時: '2025-01-15T09:00:00Z',
      作成日時: '2024-12-01T00:00:00Z',
      更新日時: '2025-01-15T09:00:00Z',
      作成者: '660e8400-e29b-41d4-a716-446655440005',
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2025-01-15T09:00:00Z',
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

    const mockCreateRecord = jest.fn(() => {
      return Promise.reject(new Error('Database connection failed'));
    });

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);
    (dataStore.createRecord as jest.Mock).mockImplementation(mockCreateRecord);

    await expect(
      recordModificationWithHistory({
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationDetails: [
          {
            fieldName: '請求金額',
            previousValue: '100000',
            newValue: '120000',
          },
        ],
        modificationReason: '営業担当者からの修正指示による金額訂正',
        modificationDateTime: new Date('2025-01-15T10:30:00Z'),
        currentDateTime: new Date('2025-01-15T14:00:00Z'),
        modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow(DataStoreError);
  });
});
