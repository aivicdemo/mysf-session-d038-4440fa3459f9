import { recordModificationWithHistory, ModifierNotAuthorized } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-638: 修正者ユーザーの有効フラグがfalseの場合', () => {
  it('ModifierNotAuthorizedエラーを返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      請求書番号: 'INV-2024-001',
      請求日: '2024-01-15T09:00:00Z',
      支払期限日: '2024-02-15T09:00:00Z',
      請求金額: 1000000,
      税額: 100000,
      税抜金額: 900000,
      請求ステータス: 'issued',
      入金日: null,
      入金金額: null,
      摘要: '正常な請求書',
      作成日時: '2024-01-10T08:00:00Z',
      更新日時: '2024-01-10T08:00:00Z',
      作成者: 'admin',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: 'valid',
      金額計算検証日時: '2024-01-10T08:30:00Z',
      参照関係検証ステータス: 'valid',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    };

    const inactiveUserData = {
      id: '990e8400-e29b-41d4-a716-446655440004',
      ユーザーID: '990e8400-e29b-41d4-a716-446655440004',
      ログインID: 'modifier_inactive',
      パスワードハッシュ: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      ユーザー名: '修正者ユーザー',
      メールアドレス: 'modifier@example.com',
      ロール: 'sales_staff',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      有効フラグ: false,
      最終ログイン日時: '2024-01-09T10:00:00Z',
      作成日時: '2024-01-01T00:00:00Z',
      更新日時: '2024-01-09T10:00:00Z',
      作成者: '990e8400-e29b-41d4-a716-446655440005',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-09T10:00:00Z',
    };

    const mockListRecords = jest.fn((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'ユーザー') {
        return Promise.resolve([inactiveUserData]);
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
            previousValue: '1000000',
            newValue: '1100000',
          },
        ],
        modificationReason: '消費税計算誤りの修正',
        modificationDateTime: new Date('2024-01-12T14:30:00Z'),
        currentDateTime: new Date('2024-01-15T15:00:00Z'),
        modifierUserId: '990e8400-e29b-41d4-a716-446655440004',
      })
    ).rejects.toThrow(ModifierNotAuthorized);

    expect(mockListRecords).toHaveBeenCalledWith('請求書');
    expect(mockListRecords).toHaveBeenCalledWith('ユーザー');
  });
});
