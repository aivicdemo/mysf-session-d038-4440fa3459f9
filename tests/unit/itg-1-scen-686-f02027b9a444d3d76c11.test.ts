import { jest } from '@jest/globals';
import { saveInvoice, InvalidInvoiceStatusError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-686: 請求ステータスが定義済みの値以外の場合、InvalidInvoiceStatusErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('invoiceStatus が定義済みの値以外の場合、InvalidInvoiceStatusError が発生する', async () => {
    const mockListRecords = dataStore.listRecords as any;
    mockListRecords.mockImplementation(async (tableName: string) => {
      if (tableName === '商談') {
        return [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            商談ID: '550e8400-e29b-41d4-a716-446655440000',
            取引先ID: '550e8400-e29b-41d4-a716-446655440001',
            営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
            商談名: 'テスト商談',
            商談金額: 110000,
            ステージ: 'クローズ',
            成約予定日: '2024-01-15T00:00:00Z',
            説明: 'テスト用商談',
            成約日: '2024-01-15T00:00:00Z',
            失注理由: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
            作成者ID: '550e8400-e29b-41d4-a716-446655440003',
            請求生成SLA期限: '2024-01-20T00:00:00Z',
            請求SLA超過フラグ: false,
          },
        ];
      }
      if (tableName === '請求明細') {
        return [
          {
            id: '550e8400-e29b-41d4-a716-446655440100',
            請求明細ID: '550e8400-e29b-41d4-a716-446655440100',
            請求書ID: null,
            商談ID: '550e8400-e29b-41d4-a716-446655440000',
            営業活動ID: '550e8400-e29b-41d4-a716-446655440200',
            明細行番号: 1,
            商品名: 'テスト商品',
            商品説明: 'テスト用商品',
            数量: 100,
            単価: 1000,
            金額: 100000,
            税率: 10,
            税額: 10000,
            税込金額: 110000,
            摘要: null,
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
            作成者: '550e8400-e29b-41d4-a716-446655440003',
            修正前数量: null,
            修正前単価: null,
            修正前金額: null,
          },
        ];
      }
      return [];
    });

    const input = {
      invoiceId: undefined,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-15T00:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '請求済予定',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: undefined,
      modificationReason: undefined,
      reissueCount: 0,
      lastReissuedAt: undefined,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '550e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2024-01-15T10:00:00Z',
    };

    await expect(saveInvoice(input)).rejects.toThrow(InvalidInvoiceStatusError);
    await expect(saveInvoice(input)).rejects.toThrow('請求ステータスが不正です。有効なステータスを選択してください。');
  });
});
