import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-702: remarksが指定された場合、その値が保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve remarks when specified', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') return [];
      if (tableName === '請求明細') return [{
        請求明細ID: '660e8400-e29b-41d4-a716-446655440001',
        請求書ID: null,
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '770e8400-e29b-41d4-a716-446655440001',
        明細行番号: 1,
        商品名: 'テスト商品A',
        商品説明: 'テスト商品の説明',
        数量: 10,
        単価: 10000,
        金額: 100000,
        税率: 10,
        税額: 10000,
        税込金額: 110000,
        摘要: null,
        作成日時: '2024-01-15T09:00:00Z',
        更新日時: '2024-01-15T09:00:00Z',
        作成者: '550e8400-e29b-41d4-a716-446655440004',
      }];
      if (tableName === '商談') return [{
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        取引先ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440003',
        商談名: 'テスト商談',
        商談金額: 110000,
        ステージ: '成約',
        成約予定日: '2024-01-10T00:00:00Z',
        説明: 'テスト商談の説明',
        成約日: '2024-01-10T00:00:00Z',
        失注理由: null,
        作成日時: '2024-01-01T09:00:00Z',
        更新日時: '2024-01-10T09:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440004',
        請求生成SLA期限: '2024-01-20T00:00:00Z',
        請求SLA超過フラグ: false,
      }];
      return [];
    });

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: 'invoice-702',
      請求書ID: 'invoice-702',
      商談ID: '550e8400-e29b-41d4-a716-446655440001',
      取引先ID: '550e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440003',
      請求書番号: 'INV-2024-001',
      請求日: '2024-01-15T00:00:00Z',
      支払期限日: '2024-02-15T00:00:00Z',
      請求金額: 110000,
      税額: 10000,
      税抜金額: 100000,
      請求ステータス: '請求済',
      入金日: null,
      入金金額: null,
      摘要: 'テスト用摘要：請求書発行',
      作成日時: '2024-01-15T10:00:00Z',
      更新日時: '2024-01-15T10:00:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440004',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済',
      参照関係検証ステータス: '検証済',
    });

    const result = await saveInvoice({
      invoiceId: null,
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      customerId: '550e8400-e29b-41d4-a716-446655440002',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440003',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-15T00:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '請求済',
      paidDate: null,
      paidAmount: null,
      remarks: 'テスト用摘要：請求書発行',
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '550e8400-e29b-41d4-a716-446655440004',
      operationTimestamp: '2024-01-15T10:00:00Z',
    });

    expect(result.remarks).toBe('テスト用摘要：請求書発行');
    expect(result.invoiceId).toBe('invoice-702');
    expect(result.reissueCount).toBe(0);
  });
});
