import { recordModificationWithHistory, TargetRecordNotFound } from '../../src/logic/modification-tracking';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-636: 修正対象の請求書IDが請求書テーブルに存在しない場合', () => {
  it('TargetRecordNotFoundエラーを返す', async () => {
    const mockListRecords = jest.fn((tableName: string) => {
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
        modificationReason: '消費税計算誤り',
        modificationDateTime: new Date('2026-10-07T10:00:00Z'),
        currentDateTime: new Date('2026-10-07T12:00:00Z'),
        modifierUserId: '660e8400-e29b-41d4-a716-446655440001',
      })
    ).rejects.toThrow(TargetRecordNotFound);

    expect(mockListRecords).toHaveBeenCalledWith('請求書');
  });
});
