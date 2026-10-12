import { jest } from '@jest/globals';
import { saveInvoice, InvoiceReferenceIntegrityError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-684: 請求書に紐付く請求明細が存在しない場合、InvoiceReferenceIntegrityErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('請求明細テーブルが空の場合、InvoiceReferenceIntegrityError が発生する', async () => {
    const mockListRecords = dataStore.listRecords as any;
    mockListRecords.mockImplementation(async (tableName: string) => {
      if (tableName === '商談') {
        return [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            商談ID: '550e8400-e29b-41d4-a716-446655440000',
            取引先ID: '550e8400-e29b-41d4-a716-446655440001',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
            商談名: 'Test Deal',
            商談金額: 110000,
            ステージ: '成約',
            成約予定日: '2025-01-15T00:00:00Z',
            説明: 'Test Description',
            成約日: '2025-01-15T00:00:00Z',
            失注理由: null,
            createdAt: '2024-12-01T00:00:00Z',
            updatedAt: '2024-12-01T00:00:00Z',
            作成者ID: '550e8400-e29b-41d4-a716-446655440003',
            請求生成SLA期限: '2025-01-20T00:00:00Z',
            請求SLA超過フラグ: false,
          },
        ];
      }
      if (tableName === '請求明細') {
        return [];
      }
      return [];
    });

    const input = {
      invoiceId: undefined,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-01-15T00:00:00Z',
      dueDate: '2025-02-15T00:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '請求済',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: undefined,
      modificationReason: undefined,
      reissueCount: 0,
      lastReissuedAt: undefined,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証待ち',
      currentUserId: '550e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2025-01-15T10:00:00Z',
    };

    await expect(saveInvoice(input)).rejects.toThrow(InvoiceReferenceIntegrityError);
    await expect(saveInvoice(input)).rejects.toThrow('請求書と請求明細の金額が一致しません。請求明細を確認してください。');
  });
});
