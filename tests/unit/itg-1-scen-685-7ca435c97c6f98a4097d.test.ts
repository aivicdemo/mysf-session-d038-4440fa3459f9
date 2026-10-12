import { jest } from '@jest/globals';
import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-685: 請求明細の合計金額が請求書の請求金額と一致する場合、正常に保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('請求明細の合計税込金額が請求書の請求金額と一致する場合、正常に保存される', async () => {
    const mockListRecords = dataStore.listRecords as any;
    const mockCreateRecord = dataStore.createRecord as any;

    const mockInvoiceOutput = {
      invoiceId: 'new-invoice-id',
      dealId: 'deal-uuid-001',
      customerId: 'customer-uuid-001',
      salesRepresentativeId: 'sales-rep-uuid-001',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-01-15T10:00:00Z',
      dueDate: '2025-02-15T23:59:59Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未請求',
      paidDate: null,
      paidAmount: null,
      remarks: '新規請求書',
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
      createdBy: 'user-uuid-001',
    };

    mockListRecords.mockImplementation(async (tableName: string) => {
      if (tableName === '商談') {
        return [
          {
            商談ID: 'deal-uuid-001',
            取引先ID: 'customer-uuid-001',
            営業担当者ID: 'sales-rep-uuid-001',
            商談名: '商談A',
            商談金額: 110000,
            ステージ: 'クローズ予定',
            成約予定日: '2025-01-31T23:59:59Z',
            説明: '説明テキスト',
            成約日: null,
            失注理由: null,
            作成日時: '2025-01-01T09:00:00Z',
            更新日時: '2025-01-15T10:00:00Z',
            作成者ID: 'user-uuid-001',
            請求生成SLA期限: '2025-02-15T23:59:59Z',
            請求SLA超過フラグ: false,
          },
        ];
      }
      if (tableName === '請求明細') {
        return [
          {
            請求明細ID: 'line-uuid-001',
            請求書ID: null,
            商談ID: 'deal-uuid-001',
            営業活動ID: 'activity-uuid-001',
            明細行番号: 1,
            商品名: '商品A',
            商品説明: '説明A',
            数量: 10,
            単価: 5000,
            金額: 50000,
            税率: 10,
            税額: 5000,
            税込金額: 55000,
            摘要: '摘要1',
            作成日時: '2025-01-10T09:00:00Z',
            更新日時: '2025-01-10T09:00:00Z',
            作成者: 'user-uuid-001',
          },
          {
            請求明細ID: 'line-uuid-002',
            請求書ID: null,
            商談ID: 'deal-uuid-001',
            営業活動ID: 'activity-uuid-002',
            明細行番号: 2,
            商品名: '商品B',
            商品説明: '説明B',
            数量: 10,
            単価: 5000,
            金額: 50000,
            税率: 10,
            税額: 5000,
            税込金額: 55000,
            摘要: '摘要2',
            作成日時: '2025-01-10T09:00:00Z',
            更新日時: '2025-01-10T09:00:00Z',
            作成者: 'user-uuid-001',
          },
        ];
      }
      return [];
    });

    mockCreateRecord.mockResolvedValue(mockInvoiceOutput);

    const input = {
      invoiceId: undefined,
      dealId: 'deal-uuid-001',
      customerId: 'customer-uuid-001',
      salesRepresentativeId: 'sales-rep-uuid-001',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-01-15T10:00:00Z',
      dueDate: '2025-02-15T23:59:59Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未請求',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: '新規請求書',
      modificationReason: undefined,
      reissueCount: 0,
      lastReissuedAt: undefined,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証待ち',
      currentUserId: 'user-uuid-001',
      operationTimestamp: '2025-01-15T10:30:00Z',
    };

    const result = await saveInvoice(input);

    expect(result).toBeDefined();
    expect(result.invoiceAmount).toBe(110000);
    expect(result.taxAmount).toBe(10000);
    expect(result.untaxedAmount).toBe(100000);
    expect(result.referenceIntegrityVerificationStatus).toBe('検証済');
  });
});
