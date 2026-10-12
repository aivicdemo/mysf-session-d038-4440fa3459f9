import { saveInvoiceModificationRecord } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-779: saveInvoiceModificationRecord - 保存後に返された修正内容レコード', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save invoice modification record and return with auto-generated ID and creation timestamp', async () => {
    const mockModificationRecordId = '770e8400-e29b-41d4-a716-446655440002';
    const mockCreatedAt = '2024-01-15T09:35:00Z';

    const mockResponse = {
      id: mockModificationRecordId,
      modificationRecordId: mockModificationRecordId,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: '{"amount": 100000}',
      modificationAfterValue: '{"amount": 110000}',
      modificationReason: '顧客からの値引き申請に対応',
      modifierId: '660e8400-e29b-41d4-a716-446655440001',
      modificationTimestamp: '2024-01-15T09:30:00Z',
      createdAt: mockCreatedAt,
    };

    jest.mocked(dataStore.createRecord).mockResolvedValue(mockResponse as any);
    jest.mocked(dataStore.listRecords).mockResolvedValue([]);

    const result = await saveInvoiceModificationRecord({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: '{"amount": 100000}',
      modificationAfterValue: '{"amount": 110000}',
      modificationReason: '顧客からの値引き申請に対応',
      modifierId: '660e8400-e29b-41d4-a716-446655440001',
      modificationTimestamp: '2024-01-15T09:30:00Z',
    });

    // Verify input values are preserved
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationCategory).toBe('金額修正');
    expect(result.modificationBeforeValue).toBe('{"amount": 100000}');
    expect(result.modificationAfterValue).toBe('{"amount": 110000}');
    expect(result.modificationReason).toBe('顧客からの値引き申請に対応');
    expect(result.modifierId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.modificationTimestamp).toBe('2024-01-15T09:30:00Z');

    // Verify system-generated values
    expect(result.modificationRecordId).toBe(mockModificationRecordId);
    expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result.modificationRecordId)).toBe(true);
    expect(result.createdAt).toBe(mockCreatedAt);
    expect(result.createdAt).not.toBe(result.modificationTimestamp);
  });
});
