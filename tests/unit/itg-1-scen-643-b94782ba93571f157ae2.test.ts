import { recordModificationWithHistory, InvalidModificationDateTime } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-643: 修正日時が対象レコードの作成日時より前の場合', () => {
  it('InvalidModificationDateTimeエラーを返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '770e8400-e29b-41d4-a716-446655440002',
      取引先ID: '880e8400-e29b-41d4-a716-446655440003',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      請求書番号: 'INV-2024-001',
      請求日: '2024-01-05T00:00:00Z',
      支払期限日: '2024-02-05T00:00:00Z',
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: '未入金',
      作成日時: '2024-01-05T08:00:00Z',
      更新日時: '2024-01-05T08:00:00Z',
      作成者: 'system',
      createdAt: '2024-01-05T08:00:00Z',
      updatedAt: '2024-01-05T08:00:00Z',
    };

    const userData = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
      ログインID: 'user-sales-001',
      ユーザー名: '営業太郎',
      メールアドレス: 'sales@example.com',
      ロール: 'sales_staff',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440004',
      有効フラグ: true,
      最終ログイン日時: '2024-01-15T10:00:00Z',
      作成日時: '2023-06-01T00:00:00Z',
      更新日時: '2024-01-15T10:00:00Z',
      createdAt: '2023-06-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
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
            newValue: '120000',
          },
        ],
        modificationReason: '請求金額の計算誤りを修正',
        modificationDateTime: new Date('2024-01-04T08:00:00Z'),
        currentDateTime: new Date('2024-01-15T14:30:00Z'),
        modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow(InvalidModificationDateTime);
  });
});
