import { saveInvoiceModificationRecord } from '../../src/logic/data-persistence';
import type {
  SaveInvoiceModificationRecordInput,
  SaveInvoiceModificationRecordOutput,
} from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-776: 修正前の値がnullで修正後の値が入力されている場合、修正内容レコードが正常に作成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('modificationBeforeValueがnullでmodificationAfterValueが値を持つ場合、正常に完了し出力が返される', async () => {
    const mockUuid = '880e8400-e29b-41d4-a716-446655440003';
    const mockCreatedAt = '2026-10-15T14:30:05Z';
    const modificationAfterValue = '{"amount": 150000}';

    const mockOutput: SaveInvoiceModificationRecordOutput = {
      modificationRecordId: mockUuid,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: null,
      modificationAfterValue: modificationAfterValue,
      modificationReason: '顧客からの値引き要望に対応',
      modifierId: '660e8400-e29b-41d4-a716-446655440111',
      modificationTimestamp: '2026-10-15T14:30:00Z',
      createdAt: mockCreatedAt,
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveInvoiceModificationRecordInput = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      modificationCategory: '金額修正',
      modificationBeforeValue: null,
      modificationAfterValue: modificationAfterValue,
      modificationReason: '顧客からの値引き要望に対応',
      modifierId: '660e8400-e29b-41d4-a716-446655440111',
      modificationTimestamp: '2026-10-15T14:30:00Z',
    };

    const result = await saveInvoiceModificationRecord(input);

    expect(result.modificationRecordId).toBe(mockUuid);
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.modificationCategory).toBe('金額修正');
    expect(result.modificationBeforeValue).toBeNull();
    expect(result.modificationAfterValue).toBe(modificationAfterValue);
    expect(result.modificationReason).toBe('顧客からの値引き要望に対応');
    expect(result.modifierId).toBe('660e8400-e29b-41d4-a716-446655440111');
    expect(result.modificationTimestamp).toBe('2026-10-15T14:30:00Z');
    expect(result.createdAt).toBe(mockCreatedAt);
  });
});
