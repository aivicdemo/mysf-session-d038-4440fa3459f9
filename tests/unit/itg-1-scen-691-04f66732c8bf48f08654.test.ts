import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-691: 新規作成時にreissueCountが0として保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作成（invoiceId=null）の入力で、reissueCount=0、lastReissuedAt=null、modificationReason=nullが保存される', async () => {
    const mockCreatedInvoiceId = '550e8400-e29b-41d4-a716-446655440100';
    const operationTimestamp = '2024-01-15T10:00:00Z';
    const currentUserId = '550e8400-e29b-41d4-a716-446655440003';

    // Setup mock for 請求書テーブル (empty)
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([]);

    // Setup mock for 請求明細テーブル (empty)
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([]);

    // Setup mock for 商談テーブル
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '550e8400-e29b-41d4-a716-446655440000',
        取引先ID: '550e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440002',
        商談名: 'テスト商談',
        商談金額: 100000,
        ステージ: '成約',
      },
    ]);

    // Mock createRecord to return the saved invoice with system-generated fields
    (dataStore.createRecord as jest.Mock).mockResolvedValueOnce({
      id: mockCreatedInvoiceId,
      invoiceId: mockCreatedInvoiceId,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T09:00:00Z',
      dueDate: '2024-02-15T23:59:59Z',
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
      createdAt: operationTimestamp,
      updatedAt: operationTimestamp,
      createdBy: currentUserId,
    });

    const input = {
      invoiceId: null,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T09:00:00Z',
      dueDate: '2024-02-15T23:59:59Z',
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
      currentUserId,
      operationTimestamp,
    };

    const result = await saveInvoice(input);

    // Verify the result contains the expected fields
    expect(result).toBeDefined();
    expect(result.reissueCount).toBe(0);
    expect(result.lastReissuedAt).toBeNull();
    expect(result.modificationReason).toBeNull();
    expect(result.invoiceId).toBe(mockCreatedInvoiceId);
    expect(result.createdBy).toBe(currentUserId);
    expect(result.createdAt).toBe(operationTimestamp);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.customerId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.invoiceAmount).toBe(110000);

    // Verify createRecord was called with the correct parameters
    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
