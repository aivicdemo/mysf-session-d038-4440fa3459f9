import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { saveInvoiceModificationRecord, DataStoreError } from '../../src/logic/data-persistence';
import type {
  SaveInvoiceModificationRecordInput,
  SaveInvoiceModificationRecordOutput,
} from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { StoredRecord } from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-777: 修正前の値が入力されていて修正後の値がnullの場合、修正内容レコードが正常に作成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a modification record with beforeValue and null afterValue', async () => {
    const mockInput: SaveInvoiceModificationRecordInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: '{"amount": 100000, "tax": 10000}',
      modificationAfterValue: null,
      modificationReason: '営業担当者の入力誤りにより金額を修正。取引先との合意済み。',
      modifierId: '660e8400-e29b-41d4-a716-446655440001',
      modificationTimestamp: '2026-10-07T06:22:11.338Z',
    };

    const mockCreatedRecord: StoredRecord = {
      id: '770e8400-e29b-41d4-a716-446655440002',
      modificationRecordId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: '{"amount": 100000, "tax": 10000}',
      modificationAfterValue: null,
      modificationReason: '営業担当者の入力誤りにより金額を修正。取引先との合意済み。',
      modifierId: '660e8400-e29b-41d4-a716-446655440001',
      modificationTimestamp: '2026-10-07T06:22:11.338Z',
      createdAt: '2026-10-07T06:22:11.338Z',
    };

    (dataStore.createRecord as jest.Mock<typeof dataStore.createRecord>).mockResolvedValue(mockCreatedRecord);

    const result = await saveInvoiceModificationRecord(mockInput);

    expect(result.modificationRecordId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationCategory).toBe('金額修正');
    expect(result.modificationBeforeValue).toBe('{"amount": 100000, "tax": 10000}');
    expect(result.modificationAfterValue).toBeNull();
    expect(result.modificationReason).toBe('営業担当者の入力誤りにより金額を修正。取引先との合意済み。');
    expect(result.modifierId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.modificationTimestamp).toBe('2026-10-07T06:22:11.338Z');
    expect(new Date(result.createdAt).getTime()).toBeGreaterThanOrEqual(new Date('2026-10-07T06:22:11.338Z').getTime());

    expect(dataStore.createRecord).toHaveBeenCalledWith(
      '請求書修正内容',
      expect.objectContaining({
        invoiceId: '550e8400-e29b-41d4-a716-446655440000',
        modificationCategory: '金額修正',
        modificationBeforeValue: '{"amount": 100000, "tax": 10000}',
        modificationAfterValue: null,
        modificationReason: '営業担当者の入力誤りにより金額を修正。取引先との合意済み。',
        modifierId: '660e8400-e29b-41d4-a716-446655440001',
        modificationTimestamp: '2026-10-07T06:22:11.338Z',
      })
    );
  });
});
