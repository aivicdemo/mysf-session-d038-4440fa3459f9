import { recordModificationWithHistory } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-635: 修正対象の請求書が存在し、修正者が有効なユーザーで、修正内容がすべて入力されており、修正日時が対象レコード作成後で現在日時以前の場合', () => {
  it('修正履歴レコードを作成して成功を返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      請求書番号: 'INV-2024-001',
      請求日: '2024-01-15T09:00:00Z',
      支払期限日: '2024-02-15T23:59:59Z',
      請求金額: 1000000,
      税額: 100000,
      税抜金額: 900000,
      請求ステータス: '有効',
      入金日: null,
      入金金額: null,
      摘要: '商品販売に関する請求',
      作成日時: '2024-01-10T08:00:00Z',
      更新日時: '2024-01-10T08:00:00Z',
      作成者: 'admin',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済み',
      金額計算検証日時: '2024-01-10T09:30:00Z',
      参照関係検証ステータス: '検証済み',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    };

    const userData = {
      id: '880e8400-e29b-41d4-a716-446655440003',
      ユーザーID: '880e8400-e29b-41d4-a716-446655440003',
      ログインID: 'sales_user_001',
      パスワードハッシュ: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      ユーザー名: '田中太郎',
      メールアドレス: 'tanaka@example.com',
      ロール: '営業',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      有効フラグ: true,
      最終ログイン日時: '2024-01-20T10:15:00Z',
      作成日時: '2023-12-01T00:00:00Z',
      更新日時: '2024-01-20T10:15:00Z',
      作成者: '00000000-0000-0000-0000-000000000000',
      createdAt: '2023-12-01T00:00:00Z',
      updatedAt: '2024-01-20T10:15:00Z',
    };

    const modificationRecordId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    const mockListRecords = jest.fn((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'ユーザー') {
        return Promise.resolve([userData]);
      }
      return Promise.resolve([]);
    });

    const mockCreateRecord = jest.fn((tableName: string, data: any) => {
      if (tableName === '請求書修正内容') {
        return Promise.resolve({ id: modificationRecordId });
      }
      return Promise.resolve({ id: 'unknown' });
    });

    (dataStore.listRecords as jest.Mock).mockImplementation(mockListRecords);
    (dataStore.createRecord as jest.Mock).mockImplementation(mockCreateRecord);

    const result = await recordModificationWithHistory({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationDetails: [
        {
          fieldName: '請求金額',
          previousValue: '1000000',
          newValue: '1050000',
        },
        {
          fieldName: '税額',
          previousValue: '100000',
          newValue: '105000',
        },
      ],
      modificationReason: '消費税率の確認に基づき金額を修正いたしました。',
      modificationDateTime: new Date('2024-01-15T14:30:00Z'),
      currentDateTime: new Date('2024-01-20T15:45:00Z'),
      modifierUserId: '880e8400-e29b-41d4-a716-446655440003',
    });

    expect(result.status).toBe('success');
    expect(result.modificationRecordId).toBe(modificationRecordId);
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationDateTime).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(result.modificationCount).toBeGreaterThanOrEqual(1);

    expect(mockCreateRecord).toHaveBeenCalledWith(
      '請求書修正内容',
      expect.objectContaining({
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationReason: '消費税率の確認に基づき金額を修正いたしました。',
        modifierUserId: '880e8400-e29b-41d4-a716-446655440003',
      })
    );
  });
});
