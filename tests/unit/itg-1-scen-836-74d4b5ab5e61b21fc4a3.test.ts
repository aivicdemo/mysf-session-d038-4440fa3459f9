import { fetchInvoiceById, type FetchInvoiceByIdOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-836: fetchInvoiceById - Paid invoice with paidDate and paidAmount not null', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paid invoice with paidDate and paidAmount', async () => {
    const invoiceId = '550e8400-e29b-41d4-a716-446655440000';

    const invoiceRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '660e8400-e29b-41d4-a716-446655440001',
      取引先ID: '770e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
      請求書番号: 'INV-2026-00001',
      請求日: '2026-01-15T09:00:00Z',
      支払期限日: '2026-02-15T09:00:00Z',
      請求金額: 1100000,
      税額: 100000,
      税抜金額: 1000000,
      請求ステータス: '入金済',
      入金日: '2026-02-10T14:30:00Z',
      入金金額: 1100000,
      摘要: '2026年1月度請求',
      作成日時: '2026-01-15T08:00:00Z',
      更新日時: '2026-02-10T14:35:00Z',
      作成者: 'user001',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済',
      金額計算検証日時: '2026-01-15T08:10:00Z',
      参照関係検証ステータス: '検証済',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-02-10T14:35:00Z',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([invoiceRecord]);

    const result = await fetchInvoiceById({ invoiceId });

    expect(result).toMatchObject({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      customerId: '770e8400-e29b-41d4-a716-446655440002',
      salesRepresentativeId: '880e8400-e29b-41d4-a716-446655440003',
      invoiceNumber: 'INV-2026-00001',
      invoiceDate: '2026-01-15T09:00:00Z',
      dueDate: '2026-02-15T09:00:00Z',
      invoiceAmount: 1100000,
      taxAmount: 100000,
      untaxedAmount: 1000000,
      invoiceStatus: '入金済',
      paidDate: '2026-02-10T14:30:00Z',
      paidAmount: 1100000,
      remarks: '2026年1月度請求',
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-02-10T14:35:00Z',
      createdBy: 'user001',
    } as FetchInvoiceByIdOutput);

    expect(result.paidDate).not.toBeNull();
    expect(result.paidAmount).not.toBeNull();
  });
});
