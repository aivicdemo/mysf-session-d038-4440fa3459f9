import { fetchInvoiceById } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-839: 再発行実績がない請求書を取得する場合、最終再発行日時がnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoice with lastReissuedAt as null when no reissue history exists', async () => {
    const mockDataStore = require('../../src/platform/data-store');

    mockDataStore.listRecords.mockResolvedValueOnce([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        請求書ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '660e8400-e29b-41d4-a716-446655440001',
        取引先ID: '770e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
        請求書番号: 'INV-2024-001',
        請求日: '2024-01-15T00:00:00Z',
        支払期限日: '2024-02-15T00:00:00Z',
        請求金額: 1100000,
        税額: 100000,
        税抜金額: 1000000,
        請求ステータス: '請求済',
        入金日: null,
        入金金額: null,
        摘要: '2024年1月分請求',
        作成日時: '2024-01-15T09:30:00Z',
        更新日時: '2024-01-15T09:30:00Z',
        作成者: 'user-123',
        修正前請求金額: null,
        修正理由: null,
        再発行回数: 0,
        最終再発行日時: null,
        金額計算検証ステータス: '検証済',
        金額計算検証日時: '2024-01-15T09:35:00Z',
        参照関係検証ステータス: '検証済',
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T09:30:00Z',
      },
    ]);

    const result = await fetchInvoiceById({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.dealId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.customerId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.salesRepresentativeId).toBe('880e8400-e29b-41d4-a716-446655440003');
    expect(result.invoiceNumber).toBe('INV-2024-001');
    expect(result.invoiceDate).toBe('2024-01-15T00:00:00Z');
    expect(result.dueDate).toBe('2024-02-15T00:00:00Z');
    expect(result.invoiceAmount).toBe(1100000);
    expect(result.taxAmount).toBe(100000);
    expect(result.untaxedAmount).toBe(1000000);
    expect(result.invoiceStatus).toBe('請求済');
    expect(result.paidDate).toBeNull();
    expect(result.paidAmount).toBeNull();
    expect(result.remarks).toBe('2024年1月分請求');
    expect(result.modificationReason).toBeNull();
    expect(result.reissueCount).toBe(0);
    expect(result.lastReissuedAt).toBeNull();
    expect(result.amountCalculationVerificationStatus).toBe('検証済');
    expect(result.referenceIntegrityVerificationStatus).toBe('検証済');
    expect(result.createdAt).toBe('2024-01-15T09:30:00Z');
    expect(result.updatedAt).toBe('2024-01-15T09:30:00Z');
    expect(result.createdBy).toBe('user-123');
  });
});
