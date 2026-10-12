import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-700: 入金済み状態でpaidAmountが整数の金額として保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve paidAmount as integer when invoiceStatus is paid', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') return [];
      if (tableName === '請求明細') return [{
        id: '990e8400-e29b-41d4-a716-446655440004',
        請求明細ID: '990e8400-e29b-41d4-a716-446655440004',
        請求書ID: null,
        商談ID: '550e8400-e29b-41d4-a716-446655440000',
        営業活動ID: 'aa0e8400-e29b-41d4-a716-446655440005',
        明細行番号: 1,
        商品名: 'テスト商品',
        商品説明: 'テスト商品の説明',
        数量: 100,
        単価: 10000,
        金額: 1000000,
        税率: 10,
        税額: 100000,
        税込金額: 1100000,
        摘要: null,
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2025-01-10T08:00:00Z',
        作成者: '880e8400-e29b-41d4-a716-446655440003',
      }];
      if (tableName === '商談') return [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '550e8400-e29b-41d4-a716-446655440000',
        取引先ID: '660e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
        商談名: 'テスト商談',
        商談金額: 1100000,
        ステージ: '成約',
        成約予定日: '2025-01-15T00:00:00Z',
        説明: 'テスト商談の説明',
        成約日: '2025-01-15T00:00:00Z',
        失注理由: null,
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2025-01-15T09:00:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440003',
        請求生成SLA期限: '2025-01-20T00:00:00Z',
        請求SLA超過フラグ: false,
      }];
      return [];
    });

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: 'invoice-700',
      請求書ID: 'invoice-700',
      商談ID: '550e8400-e29b-41d4-a716-446655440000',
      取引先ID: '660e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
      請求書番号: 'INV-2025-001',
      請求日: '2025-01-15T09:00:00Z',
      支払期限日: '2025-02-14T23:59:59Z',
      請求金額: 1100000,
      税額: 100000,
      税抜金額: 1000000,
      請求ステータス: '入金済',
      入金日: '2025-01-20T10:30:00Z',
      入金金額: 1100000,
      摘要: null,
      作成日時: '2025-01-20T10:35:00Z',
      更新日時: '2025-01-20T10:35:00Z',
      作成者: '880e8400-e29b-41d4-a716-446655440003',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済',
      参照関係検証ステータス: '検証済',
    });

    const result = await saveInvoice({
      invoiceId: null,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-01-15T09:00:00Z',
      dueDate: '2025-02-14T23:59:59Z',
      invoiceAmount: 1100000,
      taxAmount: 100000,
      untaxedAmount: 1000000,
      invoiceStatus: '入金済',
      paidDate: '2025-01-20T10:30:00Z',
      paidAmount: 1100000,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '880e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2025-01-20T10:35:00Z',
    });

    expect(result.paidAmount).toBe(1100000);
    expect(typeof result.paidAmount).toBe('number');
    expect(Number.isInteger(result.paidAmount)).toBe(true);
    expect(result.invoiceStatus).toBe('入金済');
  });
});
