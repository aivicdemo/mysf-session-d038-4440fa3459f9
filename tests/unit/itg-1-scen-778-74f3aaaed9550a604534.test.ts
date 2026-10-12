import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceModificationRecord, DataStoreError } from '../../src/logic/data-persistence';
import type { SaveInvoiceModificationRecordInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-778: 請求書修正内容テーブルへのレコード作成操作が失敗した場合、DataStoreErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store operation fails', async () => {
    const mockInput: SaveInvoiceModificationRecordInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: '{"amount": 100000}',
      modificationAfterValue: '{"amount": 120000}',
      modificationReason: '取引先との合意により単価を修正',
      modifierId: '660e8400-e29b-41d4-a716-446655440001',
      modificationTimestamp: '2026-10-07T06:22:11.338Z',
    };

    const dataStoreError = new DataStoreError('修正内容の保存に失敗しました。システム管理者に連絡してください。');
    (dataStore.createRecord as jest.Mock<typeof dataStore.createRecord>).mockRejectedValue(dataStoreError);

    await expect(saveInvoiceModificationRecord(mockInput)).rejects.toThrow(DataStoreError);
    await expect(saveInvoiceModificationRecord(mockInput)).rejects.toThrow(
      '修正内容の保存に失敗しました。システム管理者に連絡してください。'
    );

    expect(dataStore.createRecord).toHaveBeenCalledWith(
      '請求書修正内容',
      expect.objectContaining({
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '金額修正',
        modificationBeforeValue: '{"amount": 100000}',
        modificationAfterValue: '{"amount": 120000}',
        modificationReason: '取引先との合意により単価を修正',
        modifierId: '660e8400-e29b-41d4-a716-446655440001',
        modificationTimestamp: '2026-10-07T06:22:11.338Z',
      })
    );
  });
});
