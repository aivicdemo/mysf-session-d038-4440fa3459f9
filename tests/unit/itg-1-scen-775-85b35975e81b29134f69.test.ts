import { saveInvoiceModificationRecord } from '../../src/logic/data-persistence';
import type {
  SaveInvoiceModificationRecordInput,
  SaveInvoiceModificationRecordOutput,
} from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-775: 修正前の値と修正後の値は任意項目のため両方nullでも処理が進む', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('modificationBeforeValueとmodificationAfterValueが両方nullの場合、正常に完了し出力が返される', async () => {
    const mockUuid = '770e8400-e29b-41d4-a716-446655440002';
    const mockCreatedAt = '2026-10-07T10:30:05Z';

    const mockOutput: SaveInvoiceModificationRecordOutput = {
      modificationRecordId: mockUuid,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: null,
      modificationAfterValue: null,
      modificationReason: '顧客からの値引き要望により対応',
      modifierId: '660e8400-e29b-41d4-a716-446655440001',
      modificationTimestamp: '2026-10-07T10:30:00Z',
      createdAt: mockCreatedAt,
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveInvoiceModificationRecordInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: null,
      modificationAfterValue: null,
      modificationReason: '顧客からの値引き要望により対応',
      modifierId: '660e8400-e29b-41d4-a716-446655440001',
      modificationTimestamp: '2026-10-07T10:30:00Z',
    };

    const result = await saveInvoiceModificationRecord(input);

    expect(result.modificationRecordId).toBe(mockUuid);
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationCategory).toBe('金額修正');
    expect(result.modificationBeforeValue).toBeNull();
    expect(result.modificationAfterValue).toBeNull();
    expect(result.modificationReason).toBe('顧客からの値引き要望により対応');
    expect(result.modifierId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.modificationTimestamp).toBe('2026-10-07T10:30:00Z');
    expect(result.createdAt).toBe(mockCreatedAt);
  });
});
