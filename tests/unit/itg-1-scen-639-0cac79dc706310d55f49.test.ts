import { recordModificationWithHistory, IncompleteModificationDetails } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-639: 修正内容配列の要素の変更前値が空文字列またはnullの場合', () => {
  it('IncompleteModificationDetailsエラーを返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      請求書番号: 'INV-2026-001',
      請求金額: 100000,
      請求ステータス: '未入金',
      作成日時: '2026-10-01T09:00:00Z',
    };

    const userData = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
      ユーザー名: '山田太郎',
      ロール: '営業',
      有効フラグ: true,
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
            previousValue: '',
            newValue: '150000',
          },
        ],
        modificationReason: '営業部からの修正依頼による金額訂正',
        modificationDateTime: new Date('2026-10-15T10:30:00Z'),
        currentDateTime: new Date('2026-10-15T11:00:00Z'),
        modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow(IncompleteModificationDetails);
  });
});
