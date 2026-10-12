import { prepareMonthlyClosing, ExtractionScopeDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1580: 参照先商品マスタ未検出時、警告記録され参照関係エラー検出', () => {
  it('請求書の参照先商談が未検出の場合、ExtractionScopeDefinitionFailedエラーを発生させる', async () => {
    const mockCustomers: any[] = [];
    const mockDeals = [{ id: 'DEAL-001', status: 'closed_won', amount: 100000 }];
    const mockInvoices = [
      { id: 'INV-001', referenceId: 'DEAL-999', amount: 100000 },
    ];
    const mockDealStages = [{ id: 'STAGE-001', name: 'closed_won' }];
    const mockValidationRules = [
      { id: 'RULE-001', type: 'deal_to_invoice_reference_validation', isActive: true },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue(mockDeals);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(mockDealStages);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const input = {
      closingInstructionId: 'CI-2024-001',
      targetMonth: '2024-11',
      operatorUserId: 'USR-SALES-ADMIN-001',
      executionTimestamp: new Date('2024-12-01T09:00:00Z'),
    };

    await expect(prepareMonthlyClosing(input)).rejects.toThrow(ExtractionScopeDefinitionFailed);
    await expect(prepareMonthlyClosing(input)).rejects.toThrow('抽出範囲の定義に失敗しました。対象期間のデータを確認してください。');
  });
});
