import { saveInvoiceModificationRecord, SaveInvoiceModificationRecordOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-773: saveInvoiceModificationRecord - 必須項目が揃っている場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save and return invoice modification record with all required fields', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

    const modificationRecordId = '770e8400-e29b-41d4-a716-446655440222';
    mockDataStore.createRecord.mockResolvedValue({
      id: modificationRecordId,
      modificationRecordId,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: '{"amount": "100000"}',
      modificationAfterValue: '{"amount": "105000"}',
      modificationReason: '消費税計算誤りを修正',
      modifierId: '660e8400-e29b-41d4-a716-446655440111',
      modificationTimestamp: '2026-10-07T10:30:00.000Z',
      createdAt: '2026-10-07T10:30:05.000Z',
    } as any);

    const input = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: '{"amount": "100000"}',
      modificationAfterValue: '{"amount": "105000"}',
      modificationReason: '消費税計算誤りを修正',
      modifierId: '660e8400-e29b-41d4-a716-446655440111',
      modificationTimestamp: '2026-10-07T10:30:00.000Z',
    };

    const result = await saveInvoiceModificationRecord(input);

    expect(result).toBeDefined();
    expect(result.modificationRecordId).toEqual(modificationRecordId);
    expect(result.invoiceId).toEqual('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationCategory).toEqual('金額修正');
    expect(result.modificationBeforeValue).toEqual('{"amount": "100000"}');
    expect(result.modificationAfterValue).toEqual('{"amount": "105000"}');
    expect(result.modificationReason).toEqual('消費税計算誤りを修正');
    expect(result.modifierId).toEqual('660e8400-e29b-41d4-a716-446655440111');
    expect(result.modificationTimestamp).toEqual('2026-10-07T10:30:00.000Z');
    expect(result.createdAt).toEqual('2026-10-07T10:30:05.000Z');
    expect(mockDataStore.createRecord).toHaveBeenCalled();
  });
});
