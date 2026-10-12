import { recordModificationWithHistory, ModifierNotAuthorized } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-637: 修正者ユーザーIDがユーザーテーブルに存在しない場合', () => {
  it('ModifierNotAuthorizedエラーを返す', async () => {
    const invoiceData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '770e8400-e29b-41d4-a716-446655440111',
      取引先ID: '880e8400-e29b-41d4-a716-446655440222',
      営業担当者ID: '990e8400-e29b-41d4-a716-446655440333',
      請求書番号: 'INV-2026-001',
      請求日: '2026-10-01T09:00:00Z',
      支払期限日: '2026-11-01T23:59:59Z',
      請求金額: 100000,
      税額: 10000,
      税抜金額: 90000,
      請求ステータス: '未入金',
      作成日時: '2026-10-01T08:00:00Z',
      更新日時: '2026-10-01T08:00:00Z',
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    };

    const mockListRecords = jest.fn((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([invoiceData]);
      }
      if (tableName === 'ユーザー') {
        return Promise.resolve([]);
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
        modificationReason: '消費税計算の誤りを修正',
        modificationDateTime: new Date('2026-10-07T10:00:00Z'),
        currentDateTime: new Date('2026-10-07T12:00:00Z'),
        modifierUserId: '660e8400-e29b-41d4-a716-446655440999',
      })
    ).rejects.toThrow(ModifierNotAuthorized);

    expect(mockListRecords).toHaveBeenCalledWith('請求書');
    expect(mockListRecords).toHaveBeenCalledWith('ユーザー');
  });
});
