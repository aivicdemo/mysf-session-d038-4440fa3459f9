import { prepareMonthlyClosing, ExtractionCriteriaDefinitionFailed } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1579: 割引率が100%超過でエラー発生し検証中断', () => {
  it('商談データに割引率120%（1.2）が含まれている場合、ExtractionCriteriaDefinitionFailedエラーを発生させる', async () => {
    const mockCustomers = [
      { customerId: 'C1', customerName: '顧客1', status: 'active' },
      { customerId: 'C2', customerName: '顧客2', status: 'active' },
      { customerId: 'C3', customerName: '顧客3', status: 'active' },
      { customerId: 'C4', customerName: '顧客4', status: 'active' },
      { customerId: 'C5', customerName: '顧客5', status: 'active' },
      { customerId: 'C6', customerName: '顧客6', status: 'active' },
      { customerId: 'C7', customerName: '顧客7', status: 'active' },
      { customerId: 'C8', customerName: '顧客8', status: 'active' },
      { customerId: 'C9', customerName: '顧客9', status: 'active' },
      { customerId: 'C10', customerName: '顧客10', status: 'active' },
    ];
    const mockDeals = [
      { dealId: 'D1', amount: 100000, status: 'closed_won', discountRate: 0.1 },
      { dealId: 'D2', amount: 200000, status: 'closed_won', discountRate: 0.05 },
      { dealId: 'D3', amount: 300000, status: 'closed_won', discountRate: 0.0 },
      { dealId: 'D4', amount: 400000, status: 'closed_won', discountRate: 0.15 },
      { dealId: 'D5', amount: 500000, status: 'closed_won', discountRate: 0.08 },
      { dealId: 'D6', amount: 600000, status: 'closed_won', discountRate: 0.12 },
      { dealId: 'D7', amount: 700000, status: 'closed_won', discountRate: 0.2 },
      { dealId: 'D8', amount: 800000, status: 'closed_won', discountRate: 0.1 },
      { dealId: 'D9', amount: 900000, status: 'closed_won', discountRate: 0.05 },
      { dealId: 'D10', amount: 1000000, status: 'closed_won', discountRate: 0.0 },
      { dealId: 'D11', amount: 1100000, status: 'closed_won', discountRate: 0.09 },
      { dealId: 'D12', amount: 1200000, status: 'closed_won', discountRate: 0.11 },
      { dealId: 'D13', amount: 1300000, status: 'closed_won', discountRate: 0.07 },
      { dealId: 'D14', amount: 1400000, status: 'closed_won', discountRate: 0.02 },
      { dealId: 'D15', amount: 1500000, status: 'closed_won', discountRate: 1.2 },
    ];
    const mockInvoices = [
      { invoiceId: 'INV1', amount: 100000, status: 'issued' },
      { invoiceId: 'INV2', amount: 200000, status: 'issued' },
      { invoiceId: 'INV3', amount: 300000, status: 'issued' },
      { invoiceId: 'INV4', amount: 400000, status: 'issued' },
      { invoiceId: 'INV5', amount: 500000, status: 'issued' },
      { invoiceId: 'INV6', amount: 600000, status: 'issued' },
      { invoiceId: 'INV7', amount: 700000, status: 'issued' },
      { invoiceId: 'INV8', amount: 800000, status: 'issued' },
      { invoiceId: 'INV9', amount: 900000, status: 'issued' },
      { invoiceId: 'INV10', amount: 1000000, status: 'issued' },
      { invoiceId: 'INV11', amount: 1100000, status: 'issued' },
      { invoiceId: 'INV12', amount: 1200000, status: 'issued' },
    ];
    const mockDealStages = [
      { id: 'STAGE-001', name: '提案中' },
      { id: 'STAGE-002', name: '成約済み' },
      { id: 'STAGE-003', name: '失注' },
    ];
    const mockValidationRules = [
      { ruleId: 'RULE-001', ruleType: 'amountValidation', condition: 'amount > 0' },
      { ruleId: 'RULE-002', ruleType: 'quantityValidation', condition: 'quantity > 0' },
      { ruleId: 'RULE-003', ruleType: 'discountRateValidation', condition: 'discountRate <= 1.0' },
      { ruleId: 'RULE-004', ruleType: 'taxRateValidation', condition: 'taxRate >= 0' },
    ];

    (dataPersistence.fetchAllCustomers as jest.Mock).mockResolvedValue({ customers: mockCustomers });
    (dataPersistence.fetchDealsForPeriod as jest.Mock).mockResolvedValue({ deals: mockDeals });
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({ invoices: mockInvoices });
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({ stages: mockDealStages });
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({ rules: mockValidationRules });

    const input = {
      closingInstructionId: 'INST-2024-001',
      targetMonth: '2024-12',
      operatorUserId: 'USR-SALES-OPS-001',
      executionTimestamp: new Date('2025-01-05T09:00:00Z'),
    };

    await expect(prepareMonthlyClosing(input)).rejects.toThrow(ExtractionCriteriaDefinitionFailed);
    await expect(prepareMonthlyClosing(input)).rejects.toThrow('抽出条件の定義に失敗しました。システム管理者に連絡してください。');
  });
});
