import { recordModificationWithHistory, InvalidModificationDateTime } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-642: 修正日時が現在日時より後の場合', () => {
  it('InvalidModificationDateTimeエラーを返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      請求番号: 'INV-2026-001',
      請求ステータス: '未払い',
      作成日時: '2026-10-01T09:00:00Z',
      更新日時: '2026-10-01T09:00:00Z',
    };

    const userData = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      ユーザーID: '660e8400-e29b-41d4-a716-446655440001',
      ログインID: 'user001',
      ユーザー名: '営業太郎',
      ロール: '営業',
      有効フラグ: true,
      作成日時: '2026-01-01T00:00:00Z',
      更新日時: '2026-01-01T00:00:00Z',
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
        modificationReason: '数量誤りの修正',
        modificationDateTime: new Date('2026-10-08T12:00:00Z'),
        currentDateTime: new Date('2026-10-08T10:00:00Z'),
        modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow(InvalidModificationDateTime);
  });
});
