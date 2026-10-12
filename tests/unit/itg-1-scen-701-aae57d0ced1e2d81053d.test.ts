import { saveInvoice } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-701: 未入金状態でpaidAmountがnullとして保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve paidAmount as null when unpaid', async () => {
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') return [];
      if (tableName === '請求明細') return [{
        id: 'line-uuid-001',
        請求明細ID: 'line-uuid-001',
        請求書ID: null,
        商談ID: 'deal-uuid-001',
        営業活動ID: 'activity-uuid-001',
        明細行番号: 1,
        商品名: '商品A',
        商品説明: '説明',
        数量: 100,
        単価: 10000,
        金額: 1000000,
        税率: 10,
        税額: 100000,
        税込金額: 1100000,
        摘要: null,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        作成者: 'user-uuid-001',
      }];
      if (tableName === '商談') return [{
        id: 'deal-uuid-001',
        商談ID: 'deal-uuid-001',
        取引先ID: 'customer-uuid-001',
        営業担当者ID: 'salesrep-uuid-001',
        商談名: '新規案件A',
        商談金額: 1100000,
        ステージ: '受注',
        成約予定日: '2024-01-10T00:00:00Z',
        説明: 'テスト商談',
        成約日: '2024-01-10T00:00:00Z',
        失注理由: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        作成者ID: 'user-uuid-001',
        請求生成SLA期限: '2024-01-20T00:00:00Z',
        請求SLA超過フラグ: false,
      }];
      return [];
    });

    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      id: 'invoice-701',
      請求書ID: 'invoice-701',
      商談ID: 'deal-uuid-001',
      取引先ID: 'customer-uuid-001',
      営業担当者ID: 'salesrep-uuid-001',
      請求書番号: 'INV-2024-001',
      請求日: '2024-01-15T00:00:00Z',
      支払期限日: '2024-02-15T00:00:00Z',
      請求金額: 1100000,
      税額: 100000,
      税抜金額: 1000000,
      請求ステータス: '未請求',
      入金日: null,
      入金金額: null,
      摘要: null,
      作成日時: '2024-01-15T10:30:00Z',
      更新日時: '2024-01-15T10:30:00Z',
      作成者: 'user-uuid-001',
      修正前請求金額: null,
      修正理由: null,
      再発行回数: 0,
      最終再発行日時: null,
      金額計算検証ステータス: '検証済',
      参照関係検証ステータス: '検証済',
    });

    const result = await saveInvoice({
      invoiceId: null,
      dealId: 'deal-uuid-001',
      customerId: 'customer-uuid-001',
      salesRepresentativeId: 'salesrep-uuid-001',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-15T00:00:00Z',
      invoiceAmount: 1100000,
      taxAmount: 100000,
      untaxedAmount: 1000000,
      invoiceStatus: '未請求',
      paidDate: null,
      paidAmount: null,
      remarks: null,
      modificationReason: null,
      reissueCount: 0,
      lastReissuedAt: null,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: 'user-uuid-001',
      operationTimestamp: '2024-01-15T10:30:00Z',
    });

    expect(result.paidAmount).toBeNull();
    expect(result.paidDate).toBeNull();
    expect(result.invoiceStatus).toBe('未請求');
  });
});
