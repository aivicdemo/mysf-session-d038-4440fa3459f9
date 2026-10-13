import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-781: 金額差分が0.1～1%未満の場合、リスク程度が『中程度』と判定される', () => {
  const mockListRecords = jest.mocked(dataStore.listRecords);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異IDを指定して、金額差異が1%ちょうどの場合に重大度が中程度で返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: discrepancyId,
        差異ID: discrepancyId,
        旧システム請求書ID: 'INV-OLD-2024-001',
        新システム請求書ID: 'INV-NEW-2024-001',
        差異種類: '金額',
        差異内容: '請求金額の差分検出',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-01-15T10:30:00Z',
        重大度: '中程度',
        原因分類: 'データ移行エラー',
        許容範囲判定: '範囲外',
        判定日時: '2024-01-15T10:35:00Z',
        判定者: 'user-uuid-001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:35:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'inv-old-id-uuid-001',
        請求書ID: 'INV-OLD-2024-001',
        ユーザーID: 'customer-001',
        請求書番号: 'INV-OLD-2024-001',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 500000,
        税金額: 50000,
        ステータス: '確定',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: '旧システム請求書',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'inv-new-id-uuid-001',
        請求書ID: 'INV-NEW-2024-001',
        請求書番号: 'INV-NEW-2024-001',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 505000,
        税金額: 50500,
        ステータス: '確定',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: '新システム請求書',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
    ];

    mockListRecords.mockImplementation(async (tableName: string) => {
      switch (tableName) {
        case '差異検出結果':
          return discrepancyDetectionData as any;
        case '旧システム請求書':
          return legacyInvoiceData as any;
        case '新システム請求書':
          return newInvoiceData as any;
        case '是正追跡管理':
          return [];
        case '差異確認履歴':
          return [];
        default:
          return [];
      }
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection.amountDifference).toBe(5000);
    expect(result.discrepancyDetection.severity).toBe('中程度');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('範囲外');
    expect(result.legacySystemInvoice).toMatchObject({
      invoiceNumber: 'INV-OLD-2024-001',
      invoiceAmount: 500000,
    });
    expect(result.newSystemInvoice).toMatchObject({
      invoiceNumber: 'INV-NEW-2024-001',
      invoiceAmount: 505000,
    });
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
