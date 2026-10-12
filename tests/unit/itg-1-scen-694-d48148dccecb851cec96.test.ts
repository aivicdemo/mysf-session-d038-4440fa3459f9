import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-694: 再発行時にlastReissuedAtが現在の操作実行日時として保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set lastReissuedAt to operationTimestamp when reissueCount is 1', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') return [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        請求書ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        取引先ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440003',
        請求書番号: 'INV-2025-001',
        請求日: '2025-01-15T09:00:00Z',
        支払期限日: '2025-02-15T09:00:00Z',
        請求金額: 1100000,
        税額: 100000,
        税抜金額: 1000000,
        請求ステータス: '請求済',
        入金日: null,
        入金金額: null,
        摘要: '初回発行',
        作成日時: '2025-01-15T09:00:00Z',
        更新日時: '2025-01-15T09:00:00Z',
        作成者: '550e8400-e29b-41d4-a716-446655440003',
        修正前請求金額: null,
        修正理由: null,
        再発行回数: 0,
        最終再発行日時: null,
        金額計算検証ステータス: '検証済',
        参照関係検証ステータス: '検証済',
      }];
      if (tableName === '請求明細') return [{
        id: '550e8400-e29b-41d4-a716-446655440010',
        請求明細ID: '550e8400-e29b-41d4-a716-446655440010',
        請求書ID: '550e8400-e29b-41d4-a716-446655440000',
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        営業活動ID: '550e8400-e29b-41d4-a716-446655440020',
        明細行番号: 1,
        商品名: 'システム導入',
        商品説明: '営業管理システム導入サービス',
        数量: 1,
        単価: 1000000,
        金額: 1000000,
        税率: 10,
        税額: 100000,
        税込金額: 1100000,
        摘要: '2025年1月納品',
        作成日時: '2025-01-15T09:00:00Z',
        更新日時: '2025-01-15T09:00:00Z',
        作成者: '550e8400-e29b-41d4-a716-446655440003',
      }];
      if (tableName === '商談') return [{
        id: '550e8400-e29b-41d4-a716-446655440001',
        商談ID: '550e8400-e29b-41d4-a716-446655440001',
        取引先ID: '550e8400-e29b-41d4-a716-446655440002',
        営業担当者ID: '550e8400-e29b-41d4-a716-446655440003',
        商談名: 'A社システム導入案件',
        商談金額: 1100000,
        ステージ: '成約',
        成約予定日: '2025-01-15T09:00:00Z',
        説明: '営業管理システムの導入',
        成約日: '2025-01-15T09:00:00Z',
        失注理由: null,
        作成日時: '2024-12-01T10:00:00Z',
        更新日時: '2025-01-15T09:00:00Z',
        作成者ID: '550e8400-e29b-41d4-a716-446655440003',
        請求生成SLA期限: '2025-01-20T09:00:00Z',
        請求SLA超過フラグ: false,
      }];
      return [];
    });

    (dataStore.updateRecord as jest.Mock).mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      請求書ID: '550e8400-e29b-41d4-a716-446655440000',
      商談ID: '550e8400-e29b-41d4-a716-446655440001',
      取引先ID: '550e8400-e29b-41d4-a716-446655440002',
      営業担当者ID: '550e8400-e29b-41d4-a716-446655440003',
      請求書番号: 'INV-2025-001',
      請求日: '2025-01-15T09:00:00Z',
      支払期限日: '2025-02-15T09:00:00Z',
      請求金額: 1100000,
      税額: 100000,
      税抜金額: 1000000,
      請求ステータス: '請求済',
      入金日: null,
      入金金額: null,
      摘要: '初回発行',
      作成日時: '2025-01-15T09:00:00Z',
      更新日時: '2025-01-20T14:30:00Z',
      作成者: '550e8400-e29b-41d4-a716-446655440003',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 1,
      最終再発行日時: '2025-01-20T14:30:00Z',
      金額計算検証ステータス: '検証済',
      参照関係検証ステータス: '検証済',
    });

    const result = await saveInvoice({
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      customerId: '550e8400-e29b-41d4-a716-446655440002',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440003',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-01-15T09:00:00Z',
      dueDate: '2025-02-15T09:00:00Z',
      invoiceAmount: 1100000,
      taxAmount: 100000,
      untaxedAmount: 1000000,
      invoiceStatus: '請求済',
      paidDate: null,
      paidAmount: null,
      remarks: '初回発行',
      modificationReason: null,
      reissueCount: 1,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '550e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2025-01-20T14:30:00Z',
    });

    expect(result.lastReissuedAt).toBe('2025-01-20T14:30:00Z');
    expect(result.updatedAt).toBe('2025-01-20T14:30:00Z');
    expect(result.reissueCount).toBe(1);
  });
});
