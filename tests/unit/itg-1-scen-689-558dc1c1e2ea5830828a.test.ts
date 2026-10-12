import { jest } from '@jest/globals';
import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-689: 新規作成時にmodificationReasonがnullとして保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('新規作成時に modificationReason が null のままで保存される', async () => {
    const mockListRecords = dataStore.listRecords as any;
    const mockCreateRecord = dataStore.createRecord as any;

    const mockInvoiceOutput = {
      invoiceId: 'new-invoice-id-689',
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-01-15T09:00:00Z',
      dueDate: '2025-02-15T09:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未請求',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      createdBy: '880e8400-e29b-41d4-a716-446655440003',
    };

    mockListRecords.mockImplementation(async (tableName: string) => {
      if (tableName === '商談') {
        return [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            商談ID: '550e8400-e29b-41d4-a716-446655440000',
            取引先ID: '660e8400-e29b-41d4-a716-446655440001',
            営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
            商談名: 'テスト商談',
            商談金額: 100000,
            ステージ: '成約',
            成約予定日: '2025-01-10T00:00:00Z',
            説明: 'テスト用商談',
            成約日: '2025-01-10T00:00:00Z',
            失注理由: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-10T00:00:00Z',
            作成者ID: '880e8400-e29b-41d4-a716-446655440003',
            請求生成SLA期限: '2025-02-10T00:00:00Z',
            請求SLA超過フラグ: false,
          },
        ];
      }
      if (tableName === '請求明細') {
        return [
          {
            id: '990e8400-e29b-41d4-a716-446655440004',
            請求明細ID: '990e8400-e29b-41d4-a716-446655440004',
            請求書ID: null,
            商談ID: '550e8400-e29b-41d4-a716-446655440000',
            営業活動ID: 'aa0e8400-e29b-41d4-a716-446655440005',
            明細行番号: 1,
            商品名: 'テスト商品',
            商品説明: 'テスト商品の説明',
            数量: 100,
            単価: 1000,
            金額: 100000,
            税率: 10,
            税額: 10000,
            税込金額: 110000,
            摘要: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-10T00:00:00Z',
            作成者: '880e8400-e29b-41d4-a716-446655440003',
            修正前数量: null,
            修正前単価: null,
            修正前金額: null,
          },
        ];
      }
      if (tableName === '請求書') {
        return [];
      }
      return [];
    });

    mockCreateRecord.mockResolvedValue(mockInvoiceOutput);

    const input = {
      invoiceId: undefined,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-01-15T09:00:00Z',
      dueDate: '2025-02-15T09:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未請求',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: undefined,
      modificationReason: undefined,
      reissueCount: 0,
      lastReissuedAt: undefined,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '880e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2025-01-15T10:30:00Z',
    };

    const result = await saveInvoice(input);

    expect(result.modificationReason).toBeNull();
  });
});
