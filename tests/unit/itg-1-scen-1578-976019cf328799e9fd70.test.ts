import { prepareMonthlyClosing, ExtractionCriteriaDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1578: 単価・数量・割引率・税率のいずれか負値でエラー発生し検証中断', () => {
  it('商談データに負値（amount=-500）が含まれている場合、ExtractionCriteriaDefinitionFailedエラーを発生させる', async () => {
    const mockCustomers = [{ customerId: 'CUST-001', customerName: '取引先A', status: 'active' }];
    const mockDeals = [
      { dealId: 'DEAL-001', dealName: '商談A', amount: -500, quantity: 5, discountRate: 0.1, taxRate: 0.1, status: 'completed' },
    ];
    const mockInvoices = [];
    const mockDealStages = [{ stageId: 'S001', stageName: '提案' }, { stageId: 'S002', stageName: '交渉' }, { stageId: 'S003', stageName: '成約済み' }];
    const mockValidationRules = [
      { ruleId: 'RULE-001', ruleType: 'amountValidation', condition: 'amount > 0' },
      { ruleId: 'RULE-002', ruleType: 'quantityValidation', condition: 'quantity > 0' },
      { ruleId: 'RULE-003', ruleType: 'discountRateValidation', condition: 'discountRate >= 0' },
      { ruleId: 'RULE-004', ruleType: 'taxRateValidation', condition: 'taxRate >= 0' },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({ customers: mockCustomers });
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({ deals: mockDeals });
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({ invoices: mockInvoices });
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({ stages: mockDealStages });
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({ rules: mockValidationRules });

    const input = {
      closingInstructionId: 'INSTR-2025-001',
      targetMonth: '2025-01',
      operatorUserId: 'OP-USR-005',
      executionTimestamp: new Date('2025-02-01T09:00:00Z'),
    };

    await expect(prepareMonthlyClosing(input)).rejects.toThrow(ExtractionCriteriaDefinitionFailed);
    await expect(prepareMonthlyClosing(input)).rejects.toThrow('抽出条件の定義に失敗しました。システム管理者に連絡してください。');
  });
});
