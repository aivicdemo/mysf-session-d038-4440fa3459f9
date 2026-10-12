import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-698: 入金済み状態でpaidDateがISO 8601形式のタイムスタンプとして保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve paidDate as ISO 8601 timestamp when invoiceStatus is paid', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') return [];
      if (tableName === '請求明細') return [{
        id: 'detail-uuid-1',
        請求明細ID: 'detail-uuid-1',
        請求書ID: null,
        商談ID: 'deal-uuid-12345',
        営業活動ID: 'activity-uuid-1',
        明細行番号: 1,
        商品名: '商品A',
        商品説明: '説明A',
        数量: 100,
        単価: 1000,
        金額: 100000,
        税率: 10,
        税額: 10000,
        税込金額: 110000,
        摘要: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
        作成者: 'user-uuid-22222',
      }];
      if (tableName === '商談') return [{
        id: 'deal-uuid-12345',
        商談ID: 'deal-uuid-12345',
        取引先ID: 'customer-uuid-67890',
        営業担当者ID: 'sales-rep-uuid-11111',
        商談名: '商談2024-001',
        商談金額: 110000,
        ステージ: '受注',
        成約予定日: '2024-01-31T23:59:59Z',
        説明: 'テスト商談',
        成約日: '2024-01-31T23:59:59Z',
        失注理由: null,
        createdAt: '2024-01-05T08:00:00Z',
        updatedAt: '2024-01-31T12:00:00Z',
        作成者ID: 'user-uuid-22222',
        請求生成SLA期限: '2024-02-05T23:59:59Z',
        請求SLA超過フラグ: false,
      }];
      return [];
    });

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: 'invoice-uuid-698',
      請求書ID: 'invoice-uuid-698',
      商談ID: 'deal-uuid-12345',
      取引先ID: 'customer-uuid-67890',
      営業担当者ID: 'sales-rep-uuid-11111',
      請求書番号: 'INV-2024-001',
      請求日: '2024-01-15T10:00:00Z',
      支払期限日: '2024-02-15T10:00:00Z',
      請求金額: 110000,
      税額: 10000,
      税抜金額: 100000,
      請求ステータス: '入金済',
      入金日: '2024-02-10T14:30:00Z',
      入金金額: 110000,
      摘要: '銀行振込にて入金確認',
      作成日時: '2024-02-10T15:00:00Z',
      更新日時: '2024-02-10T15:00:00Z',
      作成者: 'user-uuid-22222',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済',
      参照関係検証ステータス: '検証済',
    });

    const result = await saveInvoice({
      invoiceId: null,
      dealId: 'deal-uuid-12345',
      customerId: 'customer-uuid-67890',
      salesRepresentativeId: 'sales-rep-uuid-11111',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T10:00:00Z',
      dueDate: '2024-02-15T10:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '入金済',
      paidDate: '2024-02-10T14:30:00Z',
      paidAmount: 110000,
      remarks: '銀行振込にて入金確認',
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: 'user-uuid-22222',
      operationTimestamp: '2024-02-10T15:00:00Z',
    });

    expect(result.paidDate).toBe('2024-02-10T14:30:00Z');
    expect(result.paidAmount).toBe(110000);
    expect(result.invoiceStatus).toBe('入金済');
  });
});
