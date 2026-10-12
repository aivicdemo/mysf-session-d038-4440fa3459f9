import { saveInvoiceModificationRecord, InvalidInvoiceIdError } from '../../src/logic/data-persistence';
import type { SaveInvoiceModificationRecordInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-774: 請求書ID・修正種別・修正者ID・修正理由のいずれかが空文字列またはnullの場合、対応するエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invoiceIdが空文字列の場合、InvalidInvoiceIdErrorが発生する', async () => {
    const input: SaveInvoiceModificationRecordInput = {
      invoiceId: '',
      modificationCategory: '金額修正',
      modificationReason: '顧客からの指摘による修正',
      modifierId: '550e8400-e29b-41d4-a716-446655440000',
      modificationBeforeValue: null,
      modificationAfterValue: null,
      modificationTimestamp: '2026-10-07T06:22:11.338Z',
    };

    const promise = saveInvoiceModificationRecord(input);
    await expect(promise).rejects.toThrow(InvalidInvoiceIdError);
    await expect(promise).rejects.toThrow(
      '請求書IDが指定されていません。修正対象の請求書を特定できません。'
    );
  });
});
