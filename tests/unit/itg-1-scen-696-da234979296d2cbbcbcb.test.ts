import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-696: 出力にupdatedAtが更新日時として含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include updatedAt equal to operationTimestamp in the output', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') return [];
      if (tableName === '請求明細') return [{
        id: '990e8400-e29b-41d4-a716-446655440010',
        請求明細ID: '990e8400-e29b-41d4-a716-446655440010',
        請求書ID: null,
        商談ID: '550e8400-e29b-41d4-a716-446655440000',
        営業活動ID: 'aa0e8400-e29b-41d4-a716-446655440011',
        明細行番号: 1,
        商品名: 'コンサルティングサービス',
        商品説明: '初期構築支援',
        数量: 100,
        単価: 1000,
        金額: 100000,
        税率: 10,
        税額: 10000,
        税込金額: 110000,
        摘要: null,
        createdAt: '2025-01-15T09:00:00Z',
        updatedAt: '2025-01-15T09:00:00Z',
        作成者: '880e8400-e29b-41d4-a716-446655440003',
      }];
      if (tableName === '商談') return [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '550e8400-e29b-41d4-a716-446655440000',
        取引先ID: '660e8400-e29b-41d4-a716-446655440001',
        営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
        商談名: 'システムリプレース案件',
        商談金額: 110000,
        ステージ: '成約',
        成約予定日: '2025-01-15T00:00:00Z',
        説明: 'Salesforceからのリプレース',
        成約日: '2025-01-15T00:00:00Z',
        失注理由: null,
        createdAt: '2025-01-10T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        作成者ID: '770e8400-e29b-41d4-a716-446655440002',
        請求生成SLA期限: '2025-01-22T00:00:00Z',
        請求SLA超過フラグ: false,
      }];
      return [];
    });

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: 'new-invoice-id-696',
      請求書ID: 'new-invoice-id-696',
      商談ID: '550e8400-e29b-41d4-a716-446655440000',
      取引先ID: '660e8400-e29b-41d4-a716-446655440001',
      営業担当者ID: '770e8400-e29b-41d4-a716-446655440002',
      請求書番号: 'INV-2025-00001',
      請求日: '2025-01-15T09:00:00Z',
      支払期限日: '2025-02-14T23:59:59Z',
      請求金額: 110000,
      税額: 10000,
      税抜金額: 100000,
      請求ステータス: '請求済',
      入金日: null,
      入金金額: null,
      摘要: '初回請求',
      作成日時: '2025-01-15T10:30:00Z',
      更新日時: '2025-01-15T10:30:00Z',
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
      invoiceNumber: 'INV-2025-00001',
      invoiceDate: '2025-01-15T09:00:00Z',
      dueDate: '2025-02-14T23:59:59Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '請求済',
      paidDate: null,
      paidAmount: null,
      remarks: '初回請求',
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '880e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2025-01-15T10:30:00Z',
    });

    expect(result.updatedAt).toBe('2025-01-15T10:30:00Z');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.updatedAt)).toBe(true);
  });
});
