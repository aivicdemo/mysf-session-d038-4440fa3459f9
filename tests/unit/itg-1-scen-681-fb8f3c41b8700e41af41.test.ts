import { jest } from '@jest/globals';
import { saveInvoice, InvalidInvoiceAmountError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-681: 請求金額が負数の場合、InvalidInvoiceAmountErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('invoiceAmount が負数の場合、InvalidInvoiceAmountError が発生する', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '550e8400-e29b-41d4-a716-446655440000',
        取引先ID: '550e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
        商談名: 'テスト商談',
        商談金額: 11000,
        ステージ: '成約',
        成約予定日: '2026-01-10T00:00:00Z',
        説明: 'テスト用',
        成約日: '2026-01-10T00:00:00Z',
        失注理由: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440003',
        請求生成SLA期限: '2026-01-20T00:00:00Z',
        請求SLA超過フラグ: false,
      },
    ]);

    const input = {
      invoiceId: undefined,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2026-001',
      invoiceDate: '2026-01-15T00:00:00Z',
      dueDate: '2026-02-15T00:00:00Z',
      invoiceAmount: -10000,
      taxAmount: 1000,
      untaxedAmount: 9000,
      invoiceStatus: '未請求',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: undefined,
      modificationReason: undefined,
      reissueCount: 0,
      lastReissuedAt: undefined,
      amountCalculationVerificationStatus: '検証待ち',
      referenceIntegrityVerificationStatus: '検証待ち',
      currentUserId: '550e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2026-01-15T10:00:00Z',
    };

    await expect(saveInvoice(input)).rejects.toThrow(InvalidInvoiceAmountError);
    await expect(saveInvoice(input)).rejects.toThrow('請求金額の計算が不正です。税抜金額と税額を確認してください。');
  });
});
