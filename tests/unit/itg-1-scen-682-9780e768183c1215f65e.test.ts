import { jest } from '@jest/globals';
import { saveInvoice, InvalidInvoiceAmountError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-682: 税抜金額と税額の合計が請求金額と一致しない場合、InvalidInvoiceAmountErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('untaxedAmount + taxAmount !== invoiceAmount の場合、InvalidInvoiceAmountError が発生する', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '550e8400-e29b-41d4-a716-446655440000',
        取引先ID: '660e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
        商談名: 'テスト商談',
        商談金額: 11000,
        ステージ: '成約',
        成約予定日: '2024-01-10T00:00:00Z',
        説明: 'テスト用',
        成約日: '2024-01-10T00:00:00Z',
        失注理由: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440003',
        請求生成SLA期限: '2024-01-20T00:00:00Z',
        請求SLA超過フラグ: false,
      },
    ]);

    const input = {
      invoiceId: undefined,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-15T00:00:00Z',
      invoiceAmount: 11000,
      taxAmount: 1000,
      untaxedAmount: 9500,
      invoiceStatus: '未請求',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: undefined,
      modificationReason: undefined,
      reissueCount: 0,
      lastReissuedAt: undefined,
      amountCalculationVerificationStatus: '検証待ち',
      referenceIntegrityVerificationStatus: '検証待ち',
      currentUserId: '880e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2024-01-15T10:30:00Z',
    };

    await expect(saveInvoice(input)).rejects.toThrow(InvalidInvoiceAmountError);
    await expect(saveInvoice(input)).rejects.toThrow('請求金額の計算が不正です。税抜金額と税額を確認してください。');
  });
});
